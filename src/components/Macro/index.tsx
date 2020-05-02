const saveMacro = (AP: any) => {
  return (md: any, mbp: any) => {
    AP.confluence.saveMacro(Object.assign({}, md, {updated_at: new Date()}));
    mbp.version.number = mbp.version.number + 1;
    AP.confluence.setContentProperty(mbp);
  }
};
export { saveMacro }
