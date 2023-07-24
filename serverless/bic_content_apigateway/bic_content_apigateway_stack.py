from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    custom_resources as cr,
    BundlingOptions,
    CfnOutput,
    Duration
)
from constructs import Construct
import os

class BicContentApiGatewayStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, env_name: str, parameters: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # The code that defines your stack goes here
        environment = env_name

        #######################################################################
        # Import existing VPC endpoint to be associated with the pricate api gateway
        #######################################################################
        apigateway_vpce = ec2.InterfaceVpcEndpoint.from_interface_vpc_endpoint_attributes(self, 'ApiGatewayVPCE',
            port = 443,
            vpc_endpoint_id = parameters['vpc_endpoint_id']
        )

        #######################################################################
        # Create private API gateway
        #######################################################################
        private_api = apigateway.RestApi(self, 'PrivateApi',
            rest_api_name = f'bic-{environment}-content-private-apigateway',
            # endpoint_types = [apigateway.EndpointType.PRIVATE],
            endpoint_configuration = apigateway.EndpointConfiguration(
                types = [apigateway.EndpointType.PRIVATE],
                vpc_endpoints = [apigateway_vpce]
            ),
            cloud_watch_role = True,
            deploy = True,
            deploy_options = apigateway.StageOptions(
                stage_name = environment
            ),
            description = 'Private API Gateway for the Content service',
            policy = iam.PolicyDocument(
                statements = [
                    iam.PolicyStatement(
                        principals = [iam.AnyPrincipal()],
                        actions = ['execute-api:Invoke'],
                        resources = ['execute-api:/*'],
                        effect = iam.Effect.ALLOW,
                        conditions = {
                            'StringEquals': {
                                'aws:SourceVpce': parameters['vpc_endpoint_id']
                            }
                        }
                    )
                ]
            )
        )

#         main_stage = apigateway.Stage(self, 'main',
#             deployment = private_api.latest_deployment,
#             stage_name = environment
#         )
        
        #######################################################################
        # Create lambda function
        #######################################################################
        count_token_function = lambda_.Function(self, 'CountTokenFunction',
            code = lambda_.Code.from_asset(
                os.path.join(os.getcwd(), 'lambda', 'count-token'),
                bundling = BundlingOptions(
                    image = lambda_.Runtime.PYTHON_3_10.bundling_image,
                    command = ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"]
                )
            ),
            handler = 'lambda_function.lambda_handler',
            runtime = lambda_.Runtime.PYTHON_3_10,
            architecture = lambda_.Architecture.X86_64,
            # environment = dict(
            #     key1 = "value1"
            # ),
            # log_retention = logs.RetentionDays.THREE_MONTHS,
            memory_size = 256,
            timeout = Duration.seconds(15),
            vpc = ec2.Vpc.from_lookup(self, 'ExistingVPC', vpc_id=parameters['vpc_id']),
            vpc_subnets = ec2.SubnetSelection(
                subnet_filters = [
                    ec2.SubnetFilter.by_ids(parameters['subnet_ids'])
                ]
            )
        )

        #######################################################################
        # Config proxy api with the lambda integration
        #######################################################################
        count_token_integration = apigateway.LambdaIntegration(
            handler = count_token_function,
            proxy = True
        )

        count_token_resource = private_api.root.add_resource(
            path_part = 'count-token'
        )

        count_token_post_method = count_token_resource.add_method(
            http_method = 'POST',
            integration = count_token_integration
        )

        #######################################################################
        # Stack output
        #######################################################################
        CfnOutput(self, 'ActualPrivateApiGatewayEndpoint',
            value = f'https://{private_api.rest_api_id}-{parameters["vpc_endpoint_id"]}.execute-api.{parameters["region"]}.amazonaws.com/{private_api.deployment_stage.stage_name}',
            description = "The Route53 alias which can be used to call the api internally."
        )
