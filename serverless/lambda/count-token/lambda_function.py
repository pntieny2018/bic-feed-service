import tiktoken
import json

def lambda_handler(event, context):
    encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
    body = json.loads(event['body'])
    encoded_text = encoding.encode(body['content'])
    token_count = len(encoded_text)

    return {
        'statusCode': 200,
        'body': token_count
    }