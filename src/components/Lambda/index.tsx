import * as React from 'react';
import lambdaLogo from './AWS-Lambda_Lambda-Function_light-bg_4x.svg';
import LambdaCard from './LambdaCard';
import LambdaProperty from './LambdaProperty';
import { observer, inject } from 'mobx-react';
import Spinner from '@atlaskit/spinner';

class Lambda extends React.Component<any> {
  private store: any;
  constructor(props: any) {
    super(props);
    this.store = props.lambdaStore;
  }
  public componentDidMount() {
    this.store.getLambda();
  }
  render() {
    const { lambdaDescription, tags, isLoading } = this.store;
    return (
      <LambdaCard title="Lambda" icon={lambdaLogo}>
        {
          isLoading ? <Spinner size="large" /> : <>
            <LambdaProperty name={'Name'} value={lambdaDescription.lambdaName} />
            <LambdaProperty name={'Role'} value={lambdaDescription.lambdaRole} />
            <LambdaProperty name={'Tags'} value={tags} />
            <LambdaProperty name={'Runtime'} value={lambdaDescription.lambdaRuntime} />
          </>
        }
      </LambdaCard>
    );
  }
}

export default inject(({ rootStore }) => ({
  lambdaStore: rootStore.getLambdaStore(),
}))(observer(Lambda));
