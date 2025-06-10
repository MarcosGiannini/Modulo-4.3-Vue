<template>
  <div class="todo-app">
    <h1>Mi Lista de Tareas</h1>
    
    <div class="add-task">
      <input
        type="text"
        placeholder="Añadir nueva tarea..."
        v-model="newTaskDescription"
        @keyup.enter="handleAddTask"
      />
      <button @click="handleAddTask">
        <i class="fas fa-plus"></i> Añadir
      </button>
    </div>

    <div class="search-bar">
      <input
        type="text"
        placeholder="Buscar tarea..."
        v-model="taskStore.searchTerm"
      />
    </div>

    <div class="filters">
      <button :class="{ active: currentFilter === 'all' }" @click="currentFilter = 'all'">Todas</button>
      <button :class="{ active: currentFilter === 'pending' }" @click="currentFilter = 'pending'">Pendientes</button>
      <button :class="{ active: currentFilter === 'completed' }" @click="currentFilter = 'completed'">Completadas</button>
    </div>

    <div class="sort-options">
      <button :class="{ active: taskStore.sortCriteria === 'default' }" @click="taskStore.setSortCriteria('default')">
        <i class="fas fa-sort"></i> Por Defecto
      </button>
      <button :class="{ active: taskStore.sortCriteria === 'pendingFirst' }" @click="taskStore.setSortCriteria('pendingFirst')">
        <i class="fas fa-sort-amount-down"></i> Pendientes Primero
      </button>
      <button :class="{ active: taskStore.sortCriteria === 'completedFirst' }" @click="taskStore.setSortCriteria('completedFirst')">
        <i class="fas fa-sort-amount-up"></i> Completadas Primero
      </button>
    </div>

    <div class="bulk-actions">
      <button @click="taskStore.toggleAllTasksCompletion(true)">
        <i class="fas fa-check-double"></i> Marcar Todas Completadas
      </button>
      <button @click="taskStore.toggleAllTasksCompletion(false)">
        <i class="fas fa-undo-alt"></i> Marcar Todas Pendientes
      </button>
      <button @click="taskStore.clearCompletedTasks()" class="clear-completed-button">
        <i class="fas fa-trash"></i> Borrar Completadas
      </button>
    </div>

    <ul class="task-list">
      <li v-for="task in filteredTasks" :key="task.id" :class="{ completed: task.completed }">
        <label class="checkbox-container">
          <input
            type="checkbox"
            :checked="task.completed"
            @change="taskStore.toggleTaskCompletion(task.id)"
          />
          <span class="checkmark"></span>
          <input
            v-if="editingTaskId === task.id"
            type="text"
            v-model="editingTaskDescription"
            @keyup.enter="saveEdit"
            @blur="saveEdit"
            class="edit-input"
          />
          <span v-else class="task-description-text">{{ task.description }}</span>
        </label>
        
        <div class="task-actions">
          <button v-if="editingTaskId !== task.id" @click="editTask(task)" class="edit-button">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button v-else @click="saveEdit" class="save-button">
            <i class="fas fa-save"></i> Guardar
          </button>

          <button @click="taskStore.removeTask(task.id)" class="delete-button">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      </li>
      <p v-if="filteredTasks.length === 0">No hay tareas en esta categoría.</p>
    </ul>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useTaskStore } from './stores/taskStore'; // Importación del store de Pinia.

// Inicialización de variables reactivas del componente.
const taskStore = useTaskStore(); // Instancia del store para acceder a su estado y acciones.
const newTaskDescription = ref(''); // V-model para el input de añadir nueva tarea.
const currentFilter = ref('all'); // Filtro de visualización actual ('all', 'pending', 'completed').

// Variables reactivas para la lógica de edición de tareas.
const editingTaskId = ref<number | null>(null); // ID de la tarea en edición (null si ninguna).
const editingTaskDescription = ref(''); // Contenido del input de edición temporal.

/**
 * @function handleAddTask
 * @description Maneja la adición de una nueva tarea al store.
 * Valida que la descripción no esté vacía antes de añadir.
 */
const handleAddTask = () => {
  if (newTaskDescription.value.trim() !== '') {
    taskStore.addTask(newTaskDescription.value); // Llama a la acción del store.
    newTaskDescription.value = ''; // Limpia el input tras añadir.
  } else {
    alert('Por favor, introduce la descripción de la tarea.');
  }
};

/**
 * @computed filteredTasks
 * @description Propiedad computada que devuelve las tareas según el filtro activo.
 * Depende de 'currentFilter' y de los getters del 'taskStore'.
 */
const filteredTasks = computed(() => {
  if (currentFilter.value === 'completed') {
    return taskStore.completedTasks;
  } else if (currentFilter.value === 'pending') {
    return taskStore.pendingTasks;
  } else {
    return taskStore.allTasks; // allTasks ya incluye la lógica de búsqueda y ordenamiento.
  }
});

// Watcher para depuración: Observa cambios en las tareas filtradas y los imprime en consola.
// Útil durante el desarrollo para verificar el estado de la lista.
watch(filteredTasks, (newFilteredTasks) => {
  console.log('Tareas filtradas (App.vue):', newFilteredTasks);
}, { deep: true });


/**
 * @function editTask
 * @description Activa el modo edición para una tarea específica.
 * @param {object} task - El objeto tarea a editar.
 */
const editTask = (task: { id: number; description: string }) => {
  // Si ya se está editando otra tarea, se guardan los cambios pendientes.
  if (editingTaskId.value !== null && editingTaskId.value !== task.id) {
    saveEdit(); 
  }
  
  editingTaskId.value = task.id; // Establece el ID de la tarea a editar.
  editingTaskDescription.value = task.description; // Carga la descripción actual.
  
  // nextTick asegura que el input de edición esté renderizado antes de enfocarlo.
  nextTick(() => {
    const inputElement = document.querySelector('.edit-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus(); // Enfoca el input.
      inputElement.select(); // Selecciona el texto para facilitar la edición.
    }
  });
};

/**
 * @function saveEdit
 * @description Guarda los cambios de la tarea que se está editando.
 * Se activa al presionar Enter o al perder el foco del input de edición.
 */
const saveEdit = () => {
  if (editingTaskId.value === null) return; // No hay tarea en edición.

  // Validación: la descripción no puede quedar vacía.
  if (editingTaskDescription.value.trim() === '') {
    alert('La descripción de la tarea no puede estar vacía.');
    return; // Permite al usuario corregir sin salir del modo edición.
  }

  // Llama a la acción del store para actualizar la tarea.
  taskStore.updateTaskDescription(editingTaskId.value, editingTaskDescription.value);
  editingTaskId.value = null; // Sale del modo edición.
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh; /* Asegura que el body ocupe al menos toda la altura de la ventana */
  display: flex; /* Centra el contenido del body horizontal y verticalmente */
  justify-content: center; 
  align-items: center; 
  background-color: #f0f2f5; /* Fondo general de la página */
  box-sizing: border-box; /* Incluye padding y border en el tamaño total */
  overflow-y: auto; /* Permite scroll si el contenido es más alto que la ventana */
}
</style>

<style scoped>
/* Estilos generales del contenedor principal de la aplicación */
.todo-app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #333;
  background-color: #ffe8f0; /* Color rosa suave principal */
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); /* Sombra sutil para efecto de elevación */
  max-width: 550px; /* Ancho máximo para escritorio */
  width: 100%; /* Ocupa el 100% del espacio disponible hasta max-width */
  box-sizing: border-box; /* Incluye padding y borde en el tamaño total */
  display: flex;
  flex-direction: column; /* Organiza los elementos en columna */
  align-items: center; /* Centra los elementos hijos horizontalmente */
  margin: 20px auto; /* Margen superior/inferior para desktop, auto para centrar horizontalmente */
  /* Ajuste de margin-top a 20px, y auto en los laterales */
}

h1 {
  color: #d63384; /* Tono de rosa más intenso para el título */
  margin-bottom: 30px;
  font-size: 2.2em;
  width: 100%; /* Asegura que el título ocupe el ancho completo para centrado de texto */
}

/* Estilos para la sección de añadir tarea (input + botón) */
.add-task {
  display: flex;
  gap: 10px; /* Espacio entre input y botón */
  margin-bottom: 25px;
  width: 100%;
}

.add-task input {
  flex-grow: 1; /* El input crece para ocupar el espacio disponible */
  padding: 14px;
  border: 1px solid #ffb3cc;
  border-radius: 8px;
  font-size: 1.1em;
  outline: none; /* Elimina el contorno azul al enfocar */
  transition: border-color 0.3s ease, box-shadow 0.3s ease; /* Transición suave para enfoque */
}

.add-task input:focus {
  border-color: #d63384;
  box-shadow: 0 0 0 3px rgba(214, 51, 132, 0.2);
}

.add-task button {
  padding: 12px 20px;
  background-color: #d63384;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease, transform 0.1s ease;
  display: flex; /* Para alinear el icono y el texto */
  align-items: center;
  gap: 8px; /* Espacio entre icono y texto */
}

.add-task button:hover {
  background-color: #b82a6f;
  transform: translateY(-2px); /* Efecto de elevación al pasar el ratón */
}

/* Estilos para la barra de búsqueda */
.search-bar {
  margin-bottom: 25px;
  width: 100%;
}

.search-bar input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ffb3cc;
  border-radius: 8px;
  font-size: 1.1em;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
}

.search-bar input:focus {
  border-color: #d63384;
  box-shadow: 0 0 0 3px rgba(214, 51, 132, 0.2);
}

/* Estilos para los botones de filtrado */
.filters {
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap; /* Permite que los botones salten de línea en pantallas pequeñas */
  width: 100%;
}

.filters button {
  padding: 10px 18px;
  background-color: #fce4ec; /* Rosa muy claro */
  color: #d63384; /* Rosa del botón */
  border: 1px solid #ffb3cc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.filters button:hover:not(.active) {
  background-color: #f8bbd0;
  border-color: #d63384;
  color: #d63384;
}

.filters button.active {
  background-color: #d63384;
  color: white;
  border-color: #d63384;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* Estilos para las opciones de ordenamiento */
.sort-options {
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.sort-options button {
  padding: 10px 18px;
  background-color: #e0f2f7; /* Azul claro */
  color: #007bff; /* Azul del botón */
  border: 1px solid #b3e0ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-options button:hover:not(.active) {
  background-color: #c9e6f0;
  border-color: #007bff;
  color: #007bff;
}

.sort-options button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* Acciones masivas */
.bulk-actions {
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.bulk-actions button {
  padding: 10px 18px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.bulk-actions button:hover {
  background-color: #5a6268;
}

/* Estilos específicos para el botón Borrar Completadas (rojo) */
.bulk-actions button.clear-completed-button {
  background-color: #dc3545;
}

.bulk-actions button.clear-completed-button:hover {
  background-color: #c82333;
}

/* Estilos de la lista de tareas */
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
}

.task-list li {
  background-color: #fff;
  border: 1px solid #ffb3cc;
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1em;
  color: #555;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.task-list li:last-child {
  margin-bottom: 0;
}

.task-list li.completed {
  text-decoration: line-through;
  color: #a0a0a0;
  background-color: #f8f8f8;
  border-color: #e0e0e0;
}

/* Estilos para el checkbox personalizado */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  flex-grow: 1;
  text-align: left;
}

.checkbox-container input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 20px;
  width: 20px;
  background-color: #eee;
  border: 2px solid #ccc;
  border-radius: 4px;
  margin-right: 12px;
  position: relative;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.checkbox-container input[type="checkbox"]:checked ~ .checkmark {
  background-color: #d63384;
  border-color: #d63384;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

.checkbox-container input[type="checkbox"]:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container:hover input[type="checkbox"]:not(:checked) ~ .checkmark {
  background-color: #ddd;
}

.task-description-text {
  flex-grow: 1;
  text-align: left;
  padding: 0 5px;
}

/* Estilos para el input de edición */
.task-list li .edit-input {
  flex-grow: 1;
  padding: 8px 10px;
  border: 1px solid #d63384;
  border-radius: 4px;
  font-size: 1.1em;
  margin-left: 10px;
  outline: none;
  box-sizing: border-box;
}

/* Estilos de los botones de acción (Editar, Guardar, Eliminar) */
.task-actions {
  display: flex;
  gap: 8px;
  margin-left: 15px;
  flex-shrink: 0;
}

.task-list li button {
  padding: 8px 12px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease, transform 0.1s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-button {
  background-color: #007bff;
}

.edit-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.save-button {
  background-color: #28a745;
}

.save-button:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.delete-button {
  background-color: #dc3545;
}

.delete-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

/* Mensaje cuando no hay tareas */
.task-list p {
  font-style: italic;
  color: #777;
  text-align: center;
  margin-top: 30px;
}

/* --- MEDIA QUERIES PARA RESPONSIVE DESIGN --- */

/* Para pantallas más pequeñas (móviles) */
@media (max-width: 600px) {
  .todo-app {
    margin: 0; /* Elimina márgenes en móvil para ocupar todo el ancho */
    padding: 15px;
    border-radius: 0;
    max-width: 100%;
    box-shadow: none;
  }

  h1 {
    font-size: 1.8em;
    margin-bottom: 20px;
  }

  .add-task {
    flex-direction: column;
    gap: 15px;
  }

  .add-task input,
  .add-task button {
    width: 100%;
    box-sizing: border-box;
    font-size: 1em;
    padding: 12px;
  }

  .filters,
  .sort-options,
  .bulk-actions {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .filters button,
  .sort-options button,
  .bulk-actions button {
    width: 100%;
    box-sizing: border-box;
    font-size: 0.95em;
    padding: 12px;
  }

  .task-list li {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
    gap: 10px;
  }

  .checkbox-container {
    width: 100%;
  }

  .task-actions {
    width: 100%;
    justify-content: space-around;
    margin-left: 0;
  }

  .task-list li button {
    flex-grow: 1;
    margin-left: 0;
    justify-content: center;
  }
}
</style>