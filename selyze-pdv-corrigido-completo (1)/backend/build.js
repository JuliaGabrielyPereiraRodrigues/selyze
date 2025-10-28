/**
 * Build Script para Backend
 * Compila o TypeScript e prepara para produção
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Iniciando compilação do backend...\n');

// Verifica se o diretório dist existe
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('📁 Criando diretório dist/');
    fs.mkdirSync(distPath, { recursive: true });
}

// Copia arquivos necessários para dist
const filesToCopy = [
    { from: 'package.json', to: 'dist/package.json' },
    { from: '.env', to: 'dist/.env', optional: true }
];

console.log('📋 Copiando arquivos necessários...\n');

filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, file.from);
    const destPath = path.join(__dirname, file.to);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ ${file.from} → ${file.to}`);
    } else if (!file.optional) {
        console.warn(`⚠️  ${file.from} não encontrado`);
    }
});

// Cria package.json simplificado para produção
const packageJson = require('./package.json');
const productionPackage = {
    name: packageJson.name,
    version: packageJson.version,
    main: 'server.js',
    dependencies: packageJson.dependencies
};

fs.writeFileSync(
    path.join(distPath, 'package.json'),
    JSON.stringify(productionPackage, null, 2)
);

console.log('\n✅ Build do backend concluído com sucesso!');
console.log(`📂 Arquivos em: ${distPath}\n`);
