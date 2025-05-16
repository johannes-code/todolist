[apps](apps)


# Todolist 


## Table of content

[#Introduction](#Introduction) 

[#How to use](#How%20to%20use)

[#Flowchart](#Flowchart)

[#Encryption](#Encryption)

[#Screenshots](#Screenshots)

[#Links](#Links)






## Introduction

Minimalistic todolist with encrypted user, and encrypted todos:
- Encryption clientside to not expose the server to unencrypted data.
- User sign-in and sign-up trough clerk.
- Data stored in mongoDB



## How to use

The first time you enter the webpage you will meet the sign-up/sign-in prompt, just follow the sign-up steps and you will be sent to the todomaker.

When you add a new todo, it gets displayed in a list under the todomaker.

	 Features
	
	Add
	Lets you add a new todo
	
	Delete
	Function to delete todos
	
	Complete
	Lets you make a todo as complete without removing it
	
	Priority
	Default: Normal
	Can be changed to High, or Low.







## Flowchart
![assets/todolistflow.svg]







## Encryption

**Standard:** AES-GCM was choosen because its a standard, and its ensures that the data is both encrypted and that it hasnt been tampered with.
More about the AES-GCM standard here: [Medium](https://medium.com/@kingsonejikeme_31625/api-encryption-in-next-js-keep-your-data-safe-efdf94c0eae9)


## Screenshots

Screenshot from the todolist:
![img 1](public/assets/img%201.png)




**What the databaseowner sees:**

List of todoItems:

![Skjermbilde 2025-05-14 143645](public/assets/Skjermbilde%202025-05-14%20143645.png)

Single todoItem:

![Skjermbilde 2025-05-14 143711](public/assets/Skjermbilde%202025-05-14%20143711.png)

Single user:

![Skjermbilde 2025-05-14 143811](public/assets/Skjermbilde%202025-05-14%20143811.png)








## Links

[Github](https://github.com/johannes-code/todolist)
[Vercel](https://todolist-five-jet.vercel.app/)
[Clerk](https://clerk.com/docs)
[Nextjs](https://nextjs.org/docs)
[Mongoose](https://mongoosejs.com/)
[MongoDB](https://www.mongodb.com/docs/atlas/)
[TailwindCSS](https://tailwindcss.com/docs/installation/using-vite)





