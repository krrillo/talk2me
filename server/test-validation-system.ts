/**
 * Script de prueba para verificar el sistema de validación pedagógica
 */

import { langchainService } from './services/ai/langchainService.js';

async function testValidationSystem() {
  console.log('=== INICIANDO PRUEBA DEL SISTEMA DE VALIDACIÓN PEDAGÓGICA ===\n');
  
  // Probar niveles 1, 3 y 5 para cubrir diferentes complejidades
  const testCases = [
    { theme: 'animales', level: 1, description: 'Nivel 1: Básico con oraciones simples' },
    { theme: 'familia', level: 3, description: 'Nivel 3: Intermedio con conectores' },
    { theme: 'aventura', level: 5, description: 'Nivel 5: Avanzado con subordinadas' }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`PRUEBA: ${testCase.description}`);
    console.log(`Tema: ${testCase.theme} | Nivel: ${testCase.level}`);
    console.log('='.repeat(80));
    
    try {
      const startTime = Date.now();
      
      const result = await langchainService.generateStoryWithExercises({
        theme: testCase.theme,
        level: testCase.level
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`\n✅ HISTORIA GENERADA EN ${duration.toFixed(2)}s`);
      console.log(`Título: ${result.story.title}`);
      console.log(`Páginas: ${result.story.pages.length}`);
      console.log(`Palabras totales: ${result.story.pages.map(p => p.text.split(' ').length).reduce((a, b) => a + b, 0)}`);
      
      console.log(`\n📝 EJERCICIOS GENERADOS: ${result.exercises.length}`);
      result.exercises.forEach((ex, i) => {
        console.log(`\n  ${i + 1}. ${ex.gameType}`);
        console.log(`     Título: ${ex.title}`);
        
        if (ex.gameType === 'order_sentence') {
          console.log(`     Palabras: ${ex.exercise.payload.words.join(', ')}`);
          console.log(`     Correcto: ${ex.exercise.payload.correct}`);
        } else if (ex.gameType === 'complete_words') {
          console.log(`     Oración: ${ex.exercise.payload.sentence}`);
          console.log(`     Respuesta: ${ex.exercise.payload.correct}`);
        } else if (ex.gameType === 'multi_choice') {
          console.log(`     Pregunta: ${ex.exercise.payload.question}`);
          console.log(`     Respuesta correcta: ${ex.exercise.payload.choices[ex.exercise.payload.correctIndex]}`);
        }
      });
      
      console.log(`\n✅ PRUEBA COMPLETADA EXITOSAMENTE`);
      
    } catch (error) {
      console.error(`\n❌ ERROR EN PRUEBA:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('=== PRUEBAS FINALIZADAS ===');
  console.log('='.repeat(80));
}

// Ejecutar pruebas
testValidationSystem()
  .then(() => {
    console.log('\n✅ Todas las pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
