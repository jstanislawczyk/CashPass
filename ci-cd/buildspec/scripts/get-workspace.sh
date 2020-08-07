#!/bin/bash

if [ -z $WORKSPACE ]
then
  WORKSPACE=$(sed "s/[^a-zA-Z0-9]//g" <<< $(openssl rand -base64 17))
fi

echo "Current workspace: "$WORKSPACE
