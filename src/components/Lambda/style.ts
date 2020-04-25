import styled from 'styled-components';

const CardWrapper = styled.div`
  background-color: #F2F3F6;
  width: 400px;
  border: 1px solid #F2F3F6;
  border-radius: 5px;
`;

const CardTitle = styled.div`
  position: relative;
  top: 0;
  left: 0;
  height: 45px;
  display: flex;
  align-items: center;
  width: 100%;

  & h4{
    padding-left: 0.5em;
    flex:1;
    color: rgb(52, 69, 99);
    font-size: 1.1428571428571428em;
  }
`;

const CardIcon = styled.img`
  max-height: 1.75em;
  padding-right: 0.5em;
`;

const CardContent = styled.div`
  margin: 0.5em;
  background-color: white;
  border-radius: 3px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const PropertyWrapper = styled.div`
  width: 100%;
  display: flex;
  margin: 2px 0;
  & .property-name{
    display: inline-block;
    min-width: 6em;
  }
  & .property-value{
    display: inline-block;
    font-size: 0.9em;
    margin: 0;
    padding: 0;
  }
`;

export {
  CardWrapper,
  CardTitle,
  CardIcon,
  CardContent,
  PropertyWrapper,
};
