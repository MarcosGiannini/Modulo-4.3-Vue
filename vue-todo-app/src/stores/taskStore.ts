import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';

/**
 * @interface Task
 * @description Define la estructura de un objeto tarea.
 * Es crucial para la robustez del código y la inferencia de tipos con TypeScript.
 */
interface Task {
  id: number; // Identificador único para cada tarea.
  description: string; // Contenido descriptivo de la tarea.
  completed: boolean; // Estado de la tarea (true si está completada).
}

/**
 * @function useTaskStore
 * @description Store de Pinia para la gestión global de tareas.
 * Centraliza el estado, las acciones y los getters relacionados con las tareas.
 */
export const useTaskStore = defineStore('taskStore', () => {
  // Estado: Array reactivo que contiene todas las tareas.
  // Inicialización: Carga tareas desde localStorage o un array vacío si no hay datos.
  const tasks = ref<Task[]>(JSON.parse(localStorage.getItem('tasks') || '[]'));
  
  // Estado para la funcionalidad de búsqueda.
  const searchTerm = ref(''); 
  // Estado para la funcionalidad de ordenamiento.
  const sortCriteria = ref('default'); // Opciones: 'default', 'completedFirst', 'pendingFirst'

  // Hook 'watch': Persistencia del estado en localStorage.
  // Se activa cada vez que el array 'tasks' o alguno de sus elementos cambia.
  watch(tasks, (newTasks) => {
    localStorage.setItem('tasks', JSON.stringify(newTasks));
  }, { 
    deep: true // Necesario para observar cambios profundos dentro de los objetos del array.
  });

  // Getters: Propiedades computadas para derivar estados filtrados/ordenados.
  // La base para todos los filtros y ordenamientos, aplicando primero la búsqueda.
  const allTasks = computed(() => {
    let filtered = tasks.value; 

    // Aplicar búsqueda si hay un término definido.
    if (searchTerm.value) {
      const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Aplicar ordenamiento según el criterio seleccionado.
    if (sortCriteria.value === 'completedFirst') {
      // Se crea una copia del array antes de ordenar para evitar mutaciones directas.
      return [...filtered].sort((a, b) => {
        if (a.completed && !b.completed) return -1; // Tarea completada antes que no completada
        if (!a.completed && b.completed) return 1;  // Tarea no completada después de completada
        return 0; // Mantiene el orden relativo si el estado es el mismo
      });
    } else if (sortCriteria.value === 'pendingFirst') {
      return [...filtered].sort((a, b) => {
        if (!a.completed && b.completed) return -1; // Tarea pendiente antes que completada
        if (a.completed && !b.completed) return 1;  // Tarea completada después de pendiente
        return 0;
      });
    }
    
    return filtered; // Devuelve el array filtrado por búsqueda (o completo) sin ordenación específica.
  });

  // Getters para tareas completadas y pendientes, basados en el resultado de 'allTasks'
  // Esto asegura que los filtros se aplican *después* de la búsqueda y el ordenamiento.
  const completedTasks = computed(() => allTasks.value.filter(task => task.completed));
  const pendingTasks = computed(() => allTasks.value.filter(task => !task.completed));


  // Acciones: Métodos para modificar el estado de forma predecible.

  /**
   * @function addTask
   * @description Añade una nueva tarea a la lista.
   * Genera un ID único simple (basado en el ID máximo existente + 1).
   * @param {string} description - La descripción de la nueva tarea.
   */
  const addTask = (description: string) => {
    const newTask: Task = {
      id: tasks.value.length > 0 ? Math.max(...tasks.value.map(task => task.id)) + 1 : 1,
      description,
      completed: false,
    };
    tasks.value.push(newTask);
  };

  /**
   * @function removeTask
   * @description Elimina una tarea por su ID.
   * @param {number} id - El ID de la tarea a eliminar.
   */
  const removeTask = (id: number) => {
    tasks.value = tasks.value.filter(task => task.id !== id);
  };

  /**
   * @function toggleTaskCompletion
   * @description Cambia el estado 'completed' de una tarea específica.
   * @param {number} id - El ID de la tarea a actualizar.
   */
  const toggleTaskCompletion = (id: number) => {
    const task = tasks.value.find(task => task.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  };

  /**
   * @function updateTaskDescription
   * @description Actualiza la descripción de una tarea existente.
   * @param {number} id - El ID de la tarea a actualizar.
   * @param {string} newDescription - La nueva descripción para la tarea.
   */
  const updateTaskDescription = (id: number, newDescription: string) => {
    const task = tasks.value.find(task => task.id === id);
    if (task) {
      task.description = newDescription.trim(); // Se elimina el whitespace extra.
    }
  };

  /**
   * @function setSearchTerm
   * @description Actualiza el término de búsqueda para filtrar las tareas.
   * @param {string} term - El nuevo término de búsqueda.
   */
  const setSearchTerm = (term: string) => {
    searchTerm.value = term;
  };

  /**
   * @function setSortCriteria
   * @description Establece el criterio de ordenamiento para las tareas.
   * @param {string} criteria - El criterio de ordenamiento ('default', 'completedFirst', 'pendingFirst').
   */
  const setSortCriteria = (criteria: string) => {
    sortCriteria.value = criteria;
  };

  /**
   * @function toggleAllTasksCompletion
   * @description Marca todas las tareas como completadas o pendientes.
   * Crea un nuevo array para asegurar la reactividad.
   * @param {boolean} completedStatus - 'true' para completar todas, 'false' para hacerlas pendientes.
   */
  const toggleAllTasksCompletion = (completedStatus: boolean) => {
    tasks.value = tasks.value.map(task => ({
      ...task, 
      completed: completedStatus 
    }));
  };

  /**
   * @function clearCompletedTasks
   * @description Elimina todas las tareas que están marcadas como completadas.
   */
  const clearCompletedTasks = () => {
    tasks.value = tasks.value.filter(task => !task.completed);
  };

  // Retornamos el estado, los getters y las acciones que los componentes pueden utilizar.
  return {
    tasks, // Se exporta para acceso directo si es necesario, aunque se prefieren los getters filtrados.
    addTask,
    removeTask,
    toggleTaskCompletion,
    updateTaskDescription,
    completedTasks,
    pendingTasks,
    allTasks, // El getter principal que aplica búsqueda y ordenamiento.
    setSearchTerm,
    searchTerm, // Se exporta para el v-model bidireccional en el input de búsqueda.
    sortCriteria, // Se exporta para el estado activo de los botones de ordenamiento.
    setSortCriteria,
    toggleAllTasksCompletion,
    clearCompletedTasks
  };
});