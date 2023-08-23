import tiktoken

def lambda_handler(event, context):
    encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
    encoded_text = encoding.encode("test data")

    # Count the tokens
    token_count = len(encoded_text)

    return {
        'statusCode': 200,
        'body': token_count
    }