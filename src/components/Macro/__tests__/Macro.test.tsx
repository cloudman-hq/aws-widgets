import { saveMacro } from "../index";

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

     const macroData = {
       uuid: 'uuid_1234',
     };

     const macroBodyProperty = {
       version: {
         number: 0,
       },
     };
     saveMacro(AP)(macroData, macroBodyProperty);

     AP.confluence.getMacroData((data: any) => {
       expect(data.uuid).toBe('uuid_1234');
       expect(data.updated_at).toBeDefined();
     });

     AP.confluence.getContentProperty((prop: any) => {
       expect(prop.version.number).toBe(1);
     });
     expect(macroBodyProperty.version.number).toBe(1);
   });
