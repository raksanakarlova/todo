(function() {
  // Globals: хранение данных
  const todoList = document.getElementById('todo-list');
  const selectUsers = document.getElementById('user-todo');
  const form = document.querySelector('form');

  let todos = [];
  let users = [];

  // Attach events:
  document.addEventListener('DOMContentLoaded', initApp);
  form.addEventListener('submit', handleSubmit)

  // Basic logic: Отрисовка задач и пользователей в разметке:
  function getUserName(userId) {
    const user = users.find(u => u.id === userId)
    return user.name;
  }

  function printTodo({userId, id, title, completed}) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = id;

    const status = document.createElement('input');
    status.type = 'checkbox';
    status.checked = completed;
    status.addEventListener('change', handleTodoCheckbox);

    const todoContainer = document.createElement('div');
    todoContainer.className = 'todo-item-container';
    todoContainer.innerHTML = `
                                <span class="todo-text">${title}</span>
                                <div class="todo-autor">
                                  <i>by</i> <b>${getUserName(userId)}</b>
                                </div>
                               `
    const icon = document.createElement('div');
    icon.className = 'icon-container';

    const edit = document.createElement('span');
    edit.innerHTML = '&#9998';
    edit.className = 'edit-todo';
    edit.addEventListener('click', handleEditTodo);

    const close = document.createElement('span');
    close.innerHTML = `&times`;
    close.className = 'close-todo';
    close.addEventListener('click', handleClose)

    icon.prepend(edit);
    icon.append(close);

    li.append(icon);
    li.prepend(todoContainer);
    li.prepend(status);
    todoList.prepend(li);
  }

  // Добавление пользователей select:
  function createUserOption(user) {
    const option = document.createElement('option');
    option.value = user.id;
    option.innerText = user.name;

    selectUsers.append(option);
  }

  // Удаление задач:
  function removeTodo(todoId) {
    todos = todos.filter(todo => todo.id !== todoId)

    const todo = todoList.querySelector(`[data-id="${todoId}"]`);
    console.log(todo)
    todo.querySelector('input').removeEventListener('change', handleTodoCheckbox);
    todo.querySelector('.close-todo').removeEventListener('click', handleClose);
    todo.remove()
  }

  // Редактирование задачи:
  function handleEditTodo(event) {
    const li = event.target.closest('.todo-item');
    const todoId = li.dataset.id;
    const textSpan = li.querySelector('.todo-text');
    const oldText = textSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';

    textSpan.replaceWith(input);
    input.focus();

    input.addEventListener('blur', () => finishEdit(input, todoId));
    input.addEventListener('keydown', editKey);
  }

  function editKey (event) {
    const input = event.target.closest('.edit-input');
    if(event.key === 'Enter') {
      input.blur()
    }
  }

  // Оповещение пользователя в случае ошибки:
  function alertUser(error) {
    alert(error.message)
  }

  // Event logic: сохранение данных
  function initApp() {
    Promise.all([getTodos(), getUsers()]).then(values => {
      [todos, users] = values;

      todos.forEach(todo => printTodo(todo));
      users.forEach(user => createUserOption(user));
    })
  }

  // Добавление своих задач:
  function handleSubmit(event) {
    event.preventDefault()

    createTodo({
      userId: Number(form.user.value),
      title: form.todo.value,
      completed: false
    })
  }

  // Изменение статуса задачи:
  function handleTodoCheckbox() {
    const todoId = this.parentElement.dataset.id;
    const completed = this.checked;

    toggleCompletedTodo(todoId, completed)
  }

  function handleClose() {
    const todoId = this.closest('.todo-item').dataset.id;
    deleteTodo(todoId);
  }

  // Async: получение данных с сервера:
  async function getTodos() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
      const data = await response.json();
      return data;
    } catch(err) {
      alertUser(err)
    }
  }

  async function getUsers() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      return await response.json();
    } catch(err) {
      alertUser(err)
    }
  }

  // Отправка данных на сервер:
  async function createTodo(todo) {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: {
          'Content-type': 'application/json'
        }
      });
      const newTodo = await response.json()

      printTodo(newTodo)
    } catch(err) {
      alertUser(err)
    }
  }

  // Изменение статуса чекбокса на сервере:
  async function toggleCompletedTodo(todoId, completed) {
    try {
      const response = await fetch(` https://jsonplaceholder.typicode.com/todos/${todoId} `,
        {
          method: 'PATCH',
          body: JSON.stringify({completed}),
          headers: {
            'Content-type': 'application/json'
          },
        });

      const data = await response.json()

      if(!response.ok) {
        // Оповещение пользователя
        throw new Error('Something wrong. Try later')
      }
    } catch(err) {
      alertUser(err)
    }
  }

  // Редактирование задач:
  async function finishEdit(input, todoId) {
    const newText = input.value.trim();
    if(!newText) return

    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {
        method: 'PATCH',
        body: JSON.stringify({title: newText}),
        headers: {
          'Content-type': 'application/json'
        }
      });

      if(!response.ok) {
        throw new Error('Error updating task. Try later')
      }

      const update = await response.json();

      const newSpan = document.createElement('span');
      newSpan.className = 'todo-text';
      newSpan.textContent = newText;

      input.replaceWith(newSpan);
    } catch(err) {
      alert(err)
    }
  }

  // Удаление задач на сервере:
  async function deleteTodo(todoId) {
    const response = await fetch(` https://jsonplaceholder.typicode.com/todos/${todoId}`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json'
      },
    });

    const data = await response.json();
    console.log(data);

    if(response.ok) {
      removeTodo(todoId)
    }
  }
})()



