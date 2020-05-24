import * as AWS from 'aws-sdk';
import { observable, action } from 'mobx';

class DynamodbStore {
  db: AWS.DynamoDB;
  @observable tableList: string[] = [];
  @observable isLoading: boolean = false;
  @observable error: string = '';
  @observable tableDetail: AWS.DynamoDB.TableDescription = null;
  @observable showTableDetail: boolean = false;
  constructor() {
    this.db = new AWS.DynamoDB();
    AWS.config.update(
      {
        accessKeyId: 'AKIA5Y33KLFS72P34GFM',
        secretAccessKey: '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',
        region: 'us-east-1',
      },
    );
  }
  @action getTableList = () => {
    this.isLoading = true;
    this.db.listTables({}, (err, data) => {
      this.isLoading = false;
      if (err) {
        this.error = err.message;
        // tslint:disable-next-line: no-console
        console.log('Error', err);
      } else {
        this.tableList = data.TableNames;
        this.error = '';
      }
    });
  }
  @action displayTableDetail = (tableName: string) => {
    this.isLoading = true;
    this.db.describeTable({ TableName: tableName }, (err, data) => {
      this.isLoading = false;
      if (err) {
        this.error = err.message;
        this.showTableDetail = false;
        // tslint:disable-next-line: no-console
        console.log('Error', err);
      } else {
        this.tableDetail = data.Table;
        this.error = '';
        this.showTableDetail = true;
      }
    });
  }
  @action hideTableDetail = () => {
    this.showTableDetail = false;
    this.tableDetail = {};
  }
}

export default DynamodbStore;
