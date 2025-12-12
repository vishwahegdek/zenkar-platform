
const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://vishwahegdek:n22eQ2XVpXxFBDZs@cluster0.dj4mlzp.mongodb.net/test?retryWrites=true&w=majority';

const EmployeeSchema = new mongoose.Schema({}, { strict: false });
const Employee = mongoose.model('Employee', EmployeeSchema, 'employees');

async function inspect() {
  try {
    await mongoose.connect(mongoUri);
    // Find a document that might be deleted? Or just print a few keys
    // Let's find documents that have 'delete' in key or value
    const docs = await Employee.find({}).limit(50);
    
    console.log("Checking 50 docs for 'delete' or 'status' fields...");
    let foundField = null;
    
    for(const doc of docs) {
       const obj = doc.toObject();
       // Check common keys
       if(obj.isDeleted !== undefined) console.log(`Found isDeleted: ${obj.isDeleted} for ${obj.name}`);
       if(obj.deleted !== undefined) console.log(`Found deleted: ${obj.deleted} for ${obj.name}`);
       if(obj.status !== undefined) console.log(`Found status: ${obj.status} for ${obj.name}`);
       if(obj.isActive !== undefined) console.log(`Found isActive: ${obj.isActive} for ${obj.name}`);
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
