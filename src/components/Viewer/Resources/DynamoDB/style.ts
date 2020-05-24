import styled from 'styled-components';

const TableList = styled.ul`
  list-style: none;
  padding: 0;
  overflow: scroll;
  margin: 0;
`;
const TableListItem = styled.li`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 3px;
  padding-left: 10px;
  &:hover {
    background-color: #F0F1F4;
    color: #4183C4;
    transition: background-color 0.75s ease-in-out;
  }
`;
const ResourceContainer = styled.div`
  word-break: break-all;
  max-height: 200px;
  min-height: 100px;
`;
const BackLink = styled.button`
  float: right;
  cursor: pointer;
  border: 0;
  outline: 0;
  background-color: #2185D0;
  color: white;
  border-radius: 3px;
  &:hover {
    background-color: #1D70B6;
  }
`;

export { TableList, TableListItem, ResourceContainer, BackLink };
