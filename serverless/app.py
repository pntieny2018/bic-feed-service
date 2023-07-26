#!/usr/bin/env python3
import os

import aws_cdk as cdk

from utils import config

# from bic_content_api.bic_content_serverless_stack import BicContentServerlessStack
from bic_content_apigateway.bic_content_apigateway_stack import BicContentApiGatewayStack

app = cdk.App()

# cdk <command> --context config=dev|stg|pro|...
environment = app.node.try_get_context('config')
conf = config.Config(environment)
parameters = dict(
    account_id = conf.get('account_id'),
    region = conf.get('region'),
    vpc_id = conf.get('vpc_id'),
    vpc_endpoint_id = conf.get('vpc_endpoint_id'),
    subnet_ids = conf.get('subnet_ids')
)

BicContentApiGatewayStack(app, f'bic-{environment}-content-apigateway-stack',
    env_name = environment,
    parameters = parameters,
    # If you don't specify 'env', this stack will be environment-agnostic.
    # Account/Region-dependent features and context lookups will not work,
    # but a single synthesized template can be deployed anywhere.

    # Uncomment the next line to specialize this stack for the AWS Account
    # and Region that are implied by the current CLI configuration.

    env=cdk.Environment(account=parameters['account_id'], region=parameters['region']),

    # Uncomment the next line if you know exactly what Account and Region you
    # want to deploy the stack to. */

    #env=cdk.Environment(account='123456789012', region='us-east-1'),

    # For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html
    )

app.synth()
