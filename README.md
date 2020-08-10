# CashPass
Simple AWS payment system

## Technology stack
* Lambda
* RDS
* DynamoDB
* SQS
* SNS
* Terraform
* Node.js + Typescript

## How to run?

### Initial setup
* Setup AWS CLI and AWS credentials `https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html`
* Install Terraform `https://learn.hashicorp.com/terraform/getting-started/install.html`
* Linux or Mac should be preferred but if you want to use Windows, please install Cygwin (with Makefile support) `https://www.cygwin.com/`

# Setup

## AWS Cli
Install AWS CLI, it's required https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

## Terraform
We're using Terraform `0.12.24`

## Makefile
We're using makefiles to automate our work with Terraform

## Setup infrastructure using `terraform`

1. Go to any microservice directory (like wallet or infrastructure)
2. Make sure you have proper `AWS_PROFILE` set:
    ```
    export AWS_PROFILE=YOUR_AWS_PROFILE
    ```
3. Initialize `terraform` workspace:
    You do this, by issuing:
    ```
    make -f ../../../Makefile init_workspace workspace=dev key=wallet
    ```

## Apply changes
1. Go to any environment subdirectory (wallet or infrastructure)
2. Update all modules:
    ```
    make -f ../../../Makefile terraform command=destroy workspace=dev key=wallet
    ```
   
    key - current environment (e.g. app or infrastructure)
   
    command - terraform command (plan/apply/destroy)
   
    workspace - dev/test/prod
   
3. Specify module or a resource when applying changes:
    ```
    make -f ../../../Makefile terraform-target command=apply target=module.api_gateway workspace=dev key=wallet
    ```

## Infrastructure build order
* Generate SSH keys for EC2 instances

    Go to
    ```
    terraform/modules/ec2/ssh-keys
    ```
  
    then run key `generate-ssh.sh` script (make sure keys have chmod 400 permissions set)
    
* Build infrastructure
    
    Go to infrastructure directory (terraform/environment/infrastructure)
    
    initialize terraform state (if it wasn't initialized before)
    ```
    make -f ../../../Makefile init_workspace workspace=devworkspace key=infrastructure
    ```
  
    build resources
    ```
    make -f ../../../Makefile terraform command=apply workspace=devworkspace key=infrastructure
    ```
  
* Change db credentials (optional)
    You can change db credentials in AWS Parameter Store
    
    e.g. for wallet DB you should edit
    
    - devworkspace-payment-rds-wallet-login
    
    - devworkspace-payment-rds-wallet-password
    
* Build wallet or transactions   

    Go to wallet/transactions directory (e.g. terraform/environment/wallet)
    
    initialize terraform state (if it wasn't initialized before)
    ```
    make -f ../../../Makefile init_workspace workspace=devworkspace key=wallet
    ```
  
    build resources
    ```
    make -f ../../../Makefile terraform command=apply workspace=devworkspace key=wallet
    ```
  
 * Run DB migration
     We are using Flyway (installed on EC2) for database versioning. To update db schema:
     
     - go to 
     ```
     database/wallet/scripts
     ```
     
     - run `update_schema.sh ec2url dblogin dbpassword rdsurl` script with arguments
     
     ec2url: e.g. ubuntu@ec2-11-22-33-44.compute-1.amazonaws.com
     
     dblogin: database user login
     
     dbpassword: database user password
     
     rdsurl: e.g. jdbc:mysql://database.c05hishshzfn.us-east-1.rds.amazonaws.com:3306/PaymentCluster

## Lambda build
To build node lambda, go to main lambda directory and run `npm run build-prod myenv`

myenv - current environment (e.g. test, dev)