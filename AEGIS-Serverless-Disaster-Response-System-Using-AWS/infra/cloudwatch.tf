resource "aws_sns_topic" "alerts" {
  name = "ccp-alerts-topic"
}

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "API-5XX-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alarm when API Gateway has more than 5 5XX errors in 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ApiName = "ccp-cloud-native-api"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "Lambda-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when Lambda function errors occur"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "ccp-backend-function"
  }
}
