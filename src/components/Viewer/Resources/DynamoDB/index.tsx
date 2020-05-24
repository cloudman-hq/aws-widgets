import * as React from 'react';
import ResourceCard from '../../Common/ResourceCard';
import { inject, observer } from 'mobx-react';
import { TableList, TableListItem, ResourceContainer, BackLink } from './style';
import ResourceProperty from '../../Common/ResourceProperty';

class DynamoDBComponent extends React.Component<any, any> {
  public componentDidMount() {
    const { dynamodbStore } = this.props;
    dynamodbStore.getTableList();
  }
  render() {
    const { dynamodbStore } = this.props;
    const { isLoading,
      tableList,
      showTableDetail,
      displayTableDetail,
      tableDetail,
      hideTableDetail,
    } = dynamodbStore;
    return (
      <ResourceCard title="DynamoDB" isLoading={isLoading}>
        {
          !showTableDetail ? (
            <ResourceContainer>
              <h5>Table List</h5>
              <TableList>
                {
                  tableList.map((tableName: string, index: number) => {
                    return <TableListItem key={index}
                      onClick={() => displayTableDetail(tableName)}>
                      {index + 1}: {tableName}
                    </TableListItem>;
                  })
                }
              </TableList>
            </ResourceContainer>
          ) : (
              <ResourceContainer>
                <BackLink onClick={() => hideTableDetail()}>Back</BackLink>
                <ResourceProperty name="Name" value={tableDetail.TableName} />
                <ResourceProperty name="Status" value={tableDetail.TableStatus} />
                <ResourceProperty name="ItemCount" value={tableDetail.ItemCount} />
                <ResourceProperty name="ARN" value={tableDetail.TableArn} />
              </ResourceContainer>
            )
        }
      </ResourceCard>
    );
  }
}

export default inject(({ rootStore }) => ({
  dynamodbStore: rootStore.getDynamodbStore(),
}))(observer(DynamoDBComponent));
