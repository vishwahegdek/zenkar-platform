
const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://vishwahegdek:n22eQ2XVpXxFBDZs@cluster0.dj4mlzp.mongodb.net/test?retryWrites=true&w=majority';

const EmployeeSchema = new mongoose.Schema({}, { strict: false });
const Employee = mongoose.model('Employee', EmployeeSchema, 'employees');

async function inspect() {
  try {
    await mongoose.connect(mongoUri);
    const docs = await Employee.find({}).limit(5);
    
    console.log("Printing keys of first 5 docs:");
    for(const doc of docs) {
       console.log(`[${doc.get('name')}] Keys:`, Object.keys(doc.toObject()));
       // Print full object for one
       if(doc === docs[0]) console.log(JSON.stringify(doc.toObject(), null, 2));
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
