#!/bin/bash

aws s3 cp s3://cash-pass-ssh-keys/$1 . --recursive

cd ../

if [ ! -d ssh-keys ]; then
  mkdir ssh-keys

  cd ./ssh-keys

  ssh-keygen -t rsa -N "" -f ec2key
  chmod 400 ec2key*

  aws s3 cp ./ec2key s3://cash-pass-ssh-keys/$1/ec2key
  aws s3 cp ./ec2key.pub s3://cash-pass-ssh-keys/$1/ec2key.pub
else
  echo "SSH keys already exist"
fi
