cd $1/serverless/node

for directory in */ ; do
  cd ./$directory
  npm run build-prod $WORKSPACE-cash-pass
  WORKSPACE=$WORKSPACE npm run deploy-lambda
  cd ../
done

cd $1/ci-cd/buildspec/scripts
