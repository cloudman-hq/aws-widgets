import * as React from 'react';

/**
 * Include the following scenarios:
 * 1. Access not setup - ACCESS_NOT_SETUP
 * 2. Access keys not valid - ACCESS_NOT_VALID
 * 3. Resource ID not provided - RESOURCE_ID_NOT_PROVIDED
 * 4. Resource does not exist - RESOURCE_DOES_NOT_EXIST
 * then all resources
 */
export enum ResourceType {
  UNKNOWN,
  INITIALISING,
  LAMBDA_FUNCTION,
  EC2,
  Generic,
}
