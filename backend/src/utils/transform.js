const transformDocument = (doc) => {
  if (!doc) return null;
  
  // Convert to plain object if it's a Mongoose document
  const obj = doc.toObject ? doc.toObject() : doc;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformDocument(item));
  }
  
  // Transform the object
  const transformed = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal Mongoose properties except _id
    if (key.startsWith('_') && key !== '_id') continue;
    
    // Handle ObjectId
    if (value && typeof value === 'object' && value.toString && value.toString().startsWith('ObjectId')) {
      transformed[key === '_id' ? 'id' : key] = value.toString();
      continue;
    }
    
    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[key] = transformDocument(value);
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      transformed[key] = value.map(item => 
        typeof item === 'object' ? transformDocument(item) : item
      );
      continue;
    }
    
    // Handle regular values
    transformed[key] = value;
  }
  
  // Ensure _id is transformed to id if it exists
  if (obj._id) {
    transformed.id = obj._id.toString();
    delete transformed._id;
  }
  
  return transformed;
};

module.exports = {
  transformDocument
}; 