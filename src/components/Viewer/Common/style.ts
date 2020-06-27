import styled from "styled-components";

const CardWrapper = styled.div`
  background-color: #f2f3f6;
  width: 400px;
  border: 1px solid #f2f3f6;
  border-radius: 5px;
`;

const CardTitle = styled.div`
  position: relative;
  top: 0;
  left: 0;
  height: 30px;
  display: flex;
  align-items: center;
  width: 100%;

  & h4 {
    padding-left: 0.5em;
    flex: 1;
    color: rgb(52, 69, 99);
    font-size: 1.1428571428571428em;
  }
`;

const CardIcon = styled.img`
  max-height: 1.75em;
  border-radius: 4px;
  margin-right: 0.5em;
`;

const CardContent = styled.div`
  margin: 0 0.5em 0.5em;
  background-color: white;
  border-radius: 3px;
  padding: 5px;
`;

const PropertyWrapper = styled.div`
  width: 100%;
  display: flex;
  & h5 {
    display: inline-block;
    width: 160px;
  }
  & span {
    font-size: 0.9em;
    display: inline-block;
    width: 290px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 20px;
  }
`;

const PropertyListWrapper = styled.div`
  display: flex;
  overflow hidden;
  width: 100%;
  box-sizing: border-box;
  & h5 {
    display: inline-block;
    width: 20%;
  }
  & span {
    font-size: 0.9em;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 20px;
  }
`;

const PropertyContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 80%;
`;

export {
  CardWrapper,
  CardTitle,
  CardIcon,
  CardContent,
  PropertyWrapper,
  PropertyContent,
  PropertyListWrapper,
};
