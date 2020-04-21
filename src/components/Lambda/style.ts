import styled from 'styled-components';

const LambdaCard = styled.div`
  & div:nth-child(1) {
    border-bottom: 0;
    border-radius: 3px 3px 0 0;
  }
  & div:last-child {
    border-top: 0;
    border-radius: 0 0 3px 3px;
  }
`;
const LambdaCardItemLabel = styled.div`
  padding: 0.5em;
  text-align: right;
  font-style: inherit;
  color: rgb(107, 119, 140);
  font-weight: 600;
`;
const LambdaCardItemValue = styled.div`
`;
const LambdaCardItemIcon = styled.img`
  max-height: 2em;
`;
const LambdaCardItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  max-height: 50px;
  background-color: #F9FAFB;
  border: 2px solid #DADDE2;

  & ${LambdaCardItemLabel}, ${LambdaCardItemIcon}, ${LambdaCardItemValue} {
      flex:1
  }
`;

export { LambdaCard, LambdaCardItem, LambdaCardItemLabel, LambdaCardItemValue, LambdaCardItemIcon };
