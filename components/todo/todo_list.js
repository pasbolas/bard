// iterate through a json object and return a html list of the items in the object
// the json object will have keys : date, time, content
// the returned html element will have a delete button, edit button and a mark as done button for each item in the list
function createTodoList(todoItems) {
  const todoList = document.createElement('ul');
    todoItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${item.date} ${item.time} - ${item.content}</span>
            <button class="delete-btn
            " data-id="${item.id}">Delete</button>
            <button class="edit-btn" data-id="${item.id}">Edit</button>
            <button class="done-btn" data-id="${item.id}">Mark as Done</button>
        `;
        todoList.appendChild(listItem);
    });
    return todoList;
}