terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_dynamodb_table" "app_database" {
  name           = "${var.project_name}-db"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket" "frontend_hosting" {
  bucket = "${var.project_name}-frontend-ui-849320"
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_hosting.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_hosting_access" {
  bucket = aws_s3_bucket.frontend_hosting.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_hosting.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_hosting.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "file_storage" {
  bucket = "${var.project_name}-storage-files-849320"
}

resource "aws_s3_bucket_cors_configuration" "file_storage_cors" {
  bucket = aws_s3_bucket.file_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "file_storage_access" {
  bucket = aws_s3_bucket.file_storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "file_storage_policy" {
  bucket = aws_s3_bucket.file_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.file_storage.arn}/*"
      }
    ]
  })
}

resource "aws_cognito_user_pool" "auth_pool" {
  name = "${var.project_name}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "auth_client" {
  name         = "${var.project_name}-app-client"
  user_pool_id = aws_cognito_user_pool.auth_pool.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

resource "aws_api_gateway_rest_api" "backend_api" {
  name = "${var.project_name}-api"
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "${var.project_name}-lambda-s3"
  description = "Allow Lambda to generate presigned URLs for S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.file_storage.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

resource "aws_sns_topic_subscription" "alert_sub_1" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "mahendar.71355@edu.iqra.pk"
}

resource "aws_sns_topic_subscription" "alert_sub_2" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "solangiafnan7@gmail.com"
}

resource "aws_iam_policy" "lambda_sns_policy" {
  name        = "${var.project_name}-lambda-sns"
  description = "Allow Lambda to publish to SNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sns:Publish",
          "sns:Subscribe",
          "sns:ListSubscriptionsByTopic"
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_sns_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_lambda_function" "backend_lambda" {
  filename      = "dummy_payload.zip"
  function_name = "ccp-backend-function"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "app.handler"
  runtime       = "python3.10"
  timeout       = 30
  memory_size   = 256
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.app_database.name
      S3_BUCKET_NAME      = aws_s3_bucket.file_storage.bucket
      SNS_TOPIC_ARN       = aws_sns_topic.alerts.arn
      GEMINI_API_KEY      = var.gemini_api_key
    }
  }

  lifecycle {
    ignore_changes = [filename]
  }
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.backend_api.id
  parent_id   = aws_api_gateway_rest_api.backend_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.backend_api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.backend_api.id
  resource_id   = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type             = "AWS_PROXY"
  uri              = aws_lambda_function.backend_lambda.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.backend_api.id
  resource_id   = aws_api_gateway_rest_api.backend_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.backend_api.id
  resource_id   = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type             = "AWS_PROXY"
  uri              = aws_lambda_function.backend_lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "apigw_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.backend_api.id
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.apigw_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.backend_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_api_gateway_rest_api.backend_api.execution_arn}/*/*"
}
