#!/bin/bash

echo "Packaging started"

mkdir ../artifacts
cd ../lambda

for LAMBDA_NAME in */ ; do
  LAMBDA_NAME="${LAMBDA_NAME%?}"

  echo ""
  echo "Packaging $LAMBDA_NAME lambda"

  cd $LAMBDA_NAME

  # Remove old atifacts
  rm -rf ./node_modules
  rm -rf ./build

  # Install dependencies and compile
  npm install
  npm run compile

  rm -rf ./node_modules
  npm install --only=prod

  # Copy dependencies to build LAMBDA_NAME
  cp -R node_modules build
  cd ./build

  # Remove tests files
  find ./ -name '*.spec.js' -type f -delete

  # Zip code
  zip -r $LAMBDA_NAME.zip .

  mv ./$LAMBDA_NAME.zip ../../../artifacts/

  cd ../../

  ls

  echo "Finished packaging $LAMBDA_NAME lambda"
done

echo "Packaging finished"
