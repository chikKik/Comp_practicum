/**
 * app.js - Custom JavaScript for Budget Planner WebAssembly Application
 * 
 * This file contains the JavaScript code that connects the WebAssembly module
 * with the HTML user interface. It handles UI events, calls exported C functions,
 * and updates the DOM based on the data from the WebAssembly module.
 * 
 * Author: University Professor
 * For: Computer Practicum Course - 2nd Year IT Bachelor Students
 * Date: March 2025
 */

// Wait for the DOM to be fully loaded before initializing the application
document.addEventListener('DOMContentLoaded', function() {

    // новая функция
    const themeToggle = document.getElementById('themeToggle');
    let isDarkTheme = false;
    
    themeToggle.addEventListener('click', function() {
        isDarkTheme = !isDarkTheme;
        if (isDarkTheme) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    });
    // до сюда
    
    // Get references to DOM elements
    const expenseForm = document.getElementById('expenseForm');
    const expenseDate = document.getElementById('expenseDate');
    const expenseCategory = document.getElementById('expenseCategory');
    const expenseAmount = document.getElementById('expenseAmount');
    const expenseDescription = document.getElementById('expenseDescription');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const noExpensesRow = document.getElementById('noExpensesRow');
    const totalExpensesElement = document.getElementById('totalExpenses');
    const categoryTotalsElement = document.getElementById('categoryTotals');
    const noCategoriesMessage = document.getElementById('noCategoriesMessage');
    const messageArea = document.getElementById('messageArea');
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    // Set the default date to today
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10); // Format: YYYY-MM-DD
    expenseDate.value = formattedDate;
    
    /**
     * Function to display a message to the user
     * 
     * @param {string} message - The message to display
     * @param {string} type - The type of message ('error' or 'success')
     */
    function showMessage(message, type) {
        messageArea.textContent = message;
        messageArea.className = type === 'error' ? 'error-message' : 'success-message';
        messageArea.classList.remove('hidden');
        
        // Hide the message after 3 seconds
        setTimeout(function() {
            messageArea.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Function to format a number as currency
     * 
     * @param {number} amount - The amount to format
     * @return {string} The formatted amount
     */
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }
    
    /**
     * Function to handle the form submission for adding a new expense
     * 
     * @param {Event} event - The form submission event
     */
    function handleAddExpense(event) {
        // Prevent the default form submission
        event.preventDefault();
        
        // Get the form values
        const date = expenseDate.value;
        const category = expenseCategory.value;
        const amountStr = expenseAmount.value;
        const description = expenseDescription.value;
        
        // Validate the input
        if (!date || !category || !amountStr || !description) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Parse the amount as a float
        const amount = parseFloat(amountStr);
        
        // Validate the amount
        if (isNaN(amount) || amount <= 0) {
            showMessage('Please enter a valid positive amount', 'error');
            return;
        }
        
        // Call the WebAssembly function to add the expense
        // We need to allocate memory for the strings in the WebAssembly module
        const datePtr = Module._malloc(date.length + 1);
        const categoryPtr = Module._malloc(category.length + 1);
        const descriptionPtr = Module._malloc(description.length + 1);
        
        // Write the strings to the allocated memory
        Module.stringToUTF8(date, datePtr, date.length + 1);
        Module.stringToUTF8(category, categoryPtr, category.length + 1);
        Module.stringToUTF8(description, descriptionPtr, description.length + 1);
        
        // Call the WebAssembly function
        const result = Module._jsAddExpense(datePtr, categoryPtr, amount, descriptionPtr);
        
        // Free the allocated memory
        Module._free(datePtr);
        Module._free(categoryPtr);
        Module._free(descriptionPtr);
        
        // Check the result
        if (result === 1) {
            // Success
            showMessage('Expense added successfully', 'success');
            
            // Reset the form (except the date)
            expenseCategory.value = '';
            expenseAmount.value = '';
            expenseDescription.value = '';
            
            // Focus on the category field for the next entry
            expenseCategory.focus();
        } else {
            // Failure
            showMessage('Failed to add expense. Maximum number of expenses reached.', 'error');
        }
    }
    
    /**
     * Function to handle deleting an expense
     * 
     * @param {number} index - The index of the expense to delete
     */
    function handleDeleteExpense(index) {
        // Call the WebAssembly function to delete the expense
        const result = Module._jsDeleteExpense(index);
        
        // Check the result
        if (result === 1) {
            // Success
            showMessage('Expense deleted successfully', 'success');
        } else {
            // Failure
            showMessage('Failed to delete expense. Invalid index.', 'error');
        }
    }
    
    /**
     * Function to handle clearing all expenses
     */
    function handleClearAllExpenses() {
        // Ask for confirmation
        if (confirm('Are you sure you want to clear all expenses? This action cannot be undone.')) {
            // Call the WebAssembly function to clear all expenses
            const result = Module._jsClearAllExpenses();
            
            // Check the result
            if (result === 1) {
                // Success
                showMessage('All expenses cleared successfully', 'success');
            } else {
                // Failure
                showMessage('Failed to clear expenses', 'error');
            }
        }
    }
    
    /**
     * Function to update the expense table with data from the WebAssembly module
     * This function is called from the C code when the expense data changes
     */
    window.updateExpenseTable = function() {
        // Get the number of expenses
        const expenseCount = Module._jsGetExpenseCount();
        
        // Clear the table body
        expenseTableBody.innerHTML = '';
        
        // Check if there are any expenses
        if (expenseCount === 0) {
            // No expenses, show the "No expenses" row
            expenseTableBody.appendChild(noExpensesRow);
            return;
        }
        
        // Loop through all expenses and add them to the table
        for (let i = 0; i < expenseCount; i++) {
            // Get the expense data as JSON
            const expenseJsonPtr = Module._getExpenseJSON(i);
            if (expenseJsonPtr === 0) {
                continue; // Skip invalid expenses
            }
            
            // Convert the JSON string to a JavaScript object
            const expenseJson = Module.UTF8ToString(expenseJsonPtr);
            const expense = JSON.parse(expenseJson);
            
            // Free the memory allocated for the JSON string
            Module._freeMemory(expenseJsonPtr);
            
            // Create a new row for the expense
            const row = document.createElement('tr');
            
            // Add cells for each expense property
            const dateCell = document.createElement('td');
            dateCell.textContent = expense.date;
            row.appendChild(dateCell);
            
            const categoryCell = document.createElement('td');
            categoryCell.textContent = expense.category;
            row.appendChild(categoryCell);
            
            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(expense.amount);
            row.appendChild(amountCell);
            
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = expense.description;
            row.appendChild(descriptionCell);
            
            // Add a delete button
            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete';
            deleteButton.onclick = function() {
                handleDeleteExpense(i);
            };
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);
            
            // Add the row to the table
            expenseTableBody.appendChild(row);
        }
    };
    
    /**
     * Function to update the total expenses display
     * This function is called from the C code when the expense data changes
     * 
     * @param {number} total - The total amount of all expenses
     */
    window.updateTotalExpenses = function(total) {
        totalExpensesElement.textContent = formatCurrency(total);
    };
    
    /**
     * Function to update the category totals display
     * This function is called from the C code when the expense data changes
     */
    window.updateCategoryTotals = function() {
        // Get the number of categories
        const categoryCount = Module._jsGetCategoryCount();
        
        // Clear the category totals
        categoryTotalsElement.innerHTML = '';
        
        // Check if there are any categories
        if (categoryCount === 0) {
            // No categories, show the "No categories" message
            categoryTotalsElement.appendChild(noCategoriesMessage);
            return;
        }
        
        // Loop through all categories and add them to the display
        for (let i = 0; i < categoryCount; i++) {
            // Get the category total data as JSON
            const categoryJsonPtr = Module._getCategoryTotalJSON(i);
            if (categoryJsonPtr === 0) {
                continue; // Skip invalid categories
            }
            
            // Convert the JSON string to a JavaScript object
            const categoryJson = Module.UTF8ToString(categoryJsonPtr);
            const category = JSON.parse(categoryJson);
            
            // Free the memory allocated for the JSON string
            Module._freeMemory(categoryJsonPtr);
            
            // Create a new element for the category total
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-total-item';
            categoryElement.textContent = `${category.name}: ${formatCurrency(category.total)}`;
            
            // Add the element to the category totals
            categoryTotalsElement.appendChild(categoryElement);
        }
    };
    
    // Обработчик для кнопки "Избранное"
    favoriteBtn.addEventListener('click', function() {
        // Просто выбираем категорию "Food" как избранную
        expenseCategory.value = 'Food';
        showMessage('Выбрана избранная категория: Food', 'success');
    });
    // Add event listeners
    expenseForm.addEventListener('submit', handleAddExpense);
    clearAllBtn.addEventListener('click', handleClearAllExpenses);
});

