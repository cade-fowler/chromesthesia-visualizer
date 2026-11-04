import './App.scss';
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ColorPicker from './components/ColorPicker';
import DatabaseExplorer from './components/DatabaseExplorer';


function App() {
  return (
    <>
        <Routes>
            <Route path='/' element={<Layout />}>
                <Route index element={<ColorPicker />}/>
                <Route path='/databaseexplorer' element={<DatabaseExplorer />}/>
            </Route>
        </Routes>
    </>
  );
}

export default App;
