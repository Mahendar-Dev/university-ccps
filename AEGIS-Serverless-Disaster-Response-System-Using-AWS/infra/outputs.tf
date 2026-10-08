output "frontend_url" {
  value = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.auth_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.auth_client.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.app_database.name
}

output "api_gateway_id" {
  value = aws_api_gateway_rest_api.backend_api.id
}

output "api_url" {
  value = aws_api_gateway_stage.prod.invoke_url
}
