import bcrypt from 'bcrypt';

async function hashFields(input, collection, context) {

    console.log('Update hook triggered');
    console.log('Update on: ', collection);
    
    if (!input || typeof input !== 'object') {
        console.log('Input not valid or empty, skipping...');
        return input;
    }
    
    const fields = await context.database('directus_fields')
            .select('*')
            .where({ collection });

    const fieldNames = fields.map(f => f.field);

    // Cycle through all fields of the collection
    for (const field of fields) {
        // Try the update only on hash type
        console.log(`Checking Field ${field.field}, ${field.special}`);
        if (field.special === 'hash' ) {
            const originalField = field.field;
            const bcryptField = `bcrypt_${originalField}`;
            console.log(`Field is Hash: ${originalField}, checking existence of ${bcryptField}`);

            if (fieldNames.includes(bcryptField) && Object.prototype.hasOwnProperty.call(input, originalField)) {
                const value = input[originalField];
                // Skip if already hashed
                if (typeof(value)==='string' && value !== ''){
                    if (!value.startsWith('$argon')) {
                            input[bcryptField] = await bcrypt.hash(value, 10);
                            console.log(`Hash generated for field ${originalField} on ${bcryptField}`);
                    } else {
                    console.log(`Field not modified`);
                    }
                }
            }
        }
    }
    return input;
}


export default function registerHook({ filter, services }) {

  filter('items.create', async (input, meta, context) => {
    return await hashFields(input, meta.collection, context);
  });

  filter('items.update', async (input, meta, context) => {
    return await hashFields(input, meta.collection, context);
  });

};