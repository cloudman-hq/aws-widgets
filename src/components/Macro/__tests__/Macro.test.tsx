it('Save macro should update the updated time and increase the version number of content property',
   (done) => {
     let localMacroData: any;
     let localContentProperty: any;
     const AP = {
       confluence: {
         getMacroData(cb: any) {
           cb(localMacroData);
           done();
         },
         saveMacro(md: any) {
           localMacroData = md;
         },
         getContentProperty(cb: any) {
           cb(localContentProperty);
           done();
         },
         setContentProperty(contentProperty: any) {
           localContentProperty = contentProperty;
         },
       },
     };
     const saveMacro = (md: any, mbp: any) => {
       AP.confluence.saveMacro(Object.assign({}, md, { updated_at: new Date() }));
       mbp.version.number = mbp.version.number + 1;
       AP.confluence.setContentProperty(mbp);
     };

     const macroData = {
       uuid: 'uuid_1234',
     };

     const macroBodyProperty = {
       version: {
         number: 0,
       },
     };
     saveMacro(macroData, macroBodyProperty);

     AP.confluence.getMacroData((data: any) => {
       expect(data.uuid).toBe('uuid_1234');
       expect(data.updated_at).toBeDefined();
     });

     AP.confluence.getContentProperty((prop: any) => {
       expect(prop.version.number).toBe(1);
     });
     expect(macroBodyProperty.version.number).toBe(1);
   });
