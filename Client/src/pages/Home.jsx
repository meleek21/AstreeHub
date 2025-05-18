import React from 'react'
import TodoList from '../components/TaskList/TodoList'
import MiniCalendar from '../components/MiniCalendar';
import ClosestBirthdays from '../components/ClosestBirthdays';
import WelcomeBadge from '../components/WelcomeBadge';
import DateTimeCard from '../components/DateTimeCard';
import WeatherCard from '../components/WeatherCard';

function Home() {
  return (
    <div>
      <WelcomeBadge />
      <DateTimeCard />
      <WeatherCard />
      Home <br />
      <TodoList />
      <MiniCalendar/>
    </div>
  )
}

export default Home