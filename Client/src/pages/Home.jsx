import React from 'react'
import TodoList from '../components/TaskList/TodoList'
import MiniCalendar from '../components/MiniCalendar';
import ClosestBirthdays from '../components/ClosestBirthdays';
function Home() {
  return (
    <div>
      Home <br />
    <TodoList />
    <MiniCalendar/>
    </div>
  )
}

export default Home