// scripts/createAdmin.js
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');
const promptSync = require('prompt-sync')();

// Configuración de Firebase web con las claves existentes
const firebaseConfig = {
  apiKey: "AIzaSyCeGZp5Pna87490Ns8Y_5kCtEjxw12VI2g",
  authDomain: "appja-b8f49.firebaseapp.com",
  projectId: "appja-b8f49",
  storageBucket: "appja-b8f49.firebasestorage.app",
  messagingSenderId: "276671305114",
  appId: "1:276671305114:web:121705036997ea74bc1623"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    console.log('\n=== Creación de Usuario Administrador ===\n');
    
    // Solicitar datos del administrador
    const email = promptSync('Email (default: admin@agrogestion.com): ') || 'admin@agrogestion.com';
    const username = promptSync('Nombre de usuario (default: admin): ') || 'admin';
    const password = promptSync('Contraseña (default: Admin123!): ') || 'Admin123!';
    const displayName = promptSync('Nombre completo (default: Administrador): ') || 'Administrador';
    
    // Verificar si el nombre de usuario ya existe
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.error('\n❌ Error: El nombre de usuario ya está en uso.');
      process.exit(1);
    }
    
    console.log('\nCreando usuario administrador...');
    
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: email,
      username: username,
      displayName: displayName,
      role: 'admin',
      permissions: {
        admin: true,
        dashboard: true,
        products: true,
        transfers: true,
        purchases: true,
        fumigations: true,
        fields: true,
        warehouses: true,
        reports: true,
        users: true,
        harvests: true // Agregar permiso para cosechas
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('\n✅ Usuario administrador creado exitosamente:');
    console.log(`   Email: ${email}`);
    console.log(`   Usuario: ${username}`);
    console.log(`   Nombre: ${displayName}`);
    console.log(`   ID: ${user.uid}`);
    console.log('\n¡Importante! Guarda estas credenciales en un lugar seguro.');
    
  } catch (error) {
    console.error('\n❌ Error al crear usuario administrador:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\nEl email ya está en uso. Si olvidaste la contraseña, puedes restablecerla desde la aplicación.');
    }
  } finally {
    process.exit(0);
  }
}

createAdmin();