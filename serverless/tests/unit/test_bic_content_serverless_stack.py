import aws_cdk as core
import aws_cdk.assertions as assertions

from bic_content_serverless.bic_content_serverless_stack import BicContentServerlessStack

# example tests. To run these tests, uncomment this file along with the example
# resource in bic_content_serverless/bic_content_serverless_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = BicContentServerlessStack(app, "bic-content-serverless")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
