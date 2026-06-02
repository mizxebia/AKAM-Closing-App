/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "crc5c_buyerledgers": {
    "tableId": "",
    "version": "",
    "primaryKey": "crc5c_buyerledgerid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr7de_closingticketdetailses": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr7de_closingticketdetailsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "crc5c_copyscheduledchargeses": {
    "tableId": "",
    "version": "",
    "primaryKey": "crc5c_copyscheduledchargesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr7de_invoicedetailses": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr7de_invoicedetailsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr7de_newownerticketdetailses": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr7de_newownerticketdetailsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "crc5c_sellerledgers": {
    "tableId": "",
    "version": "",
    "primaryKey": "crc5c_sellerledgerid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "crc5c_unpaidchargeses": {
    "tableId": "",
    "version": "",
    "primaryKey": "crc5c_unpaidchargesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "nsc_generate_invoice": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "nsc_generate_new_owner_ticket": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  }
};
