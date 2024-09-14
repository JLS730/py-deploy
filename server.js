import express from 'express'
import bodyParser from 'body-parser'
import myspl from 'mysql2'
import dotenv from 'dotenv'

dotenv.config({path: '../../.env'})

const app = express()

app.use(express.static('build'))

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json())
app.use(express.text())

const adoptionPool = myspl.createPool({
    host: 'adoption-base.cl6agyw0ww8k.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: process.env.SERVER_PASSWORD,
    database: 'adoption'
}).promise()

const userFavoritesPool = myspl.createPool({
    host: 'adoption-base.cl6agyw0ww8k.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: process.env.SERVER_PASSWORD,
    database: 'adoption_user_favorites'
}).promise()

const adoptionPoolResult = await adoptionPool.query("SELECT * FROM animals")
const adoptionList = adoptionPoolResult[0]

async function createUser(id, email, username, password) {
    await adoptionPool.query(`
        INSERT INTO users (user_id, email, username, password)
        VALUES (?, ?, ?, ?)    
    `, [id, email, username, password])
}

async function createUserFavoriteTable(id) {
    await adoptionPool.query(`
        CREATE TABLE adoption_user_favorites.${id} (
        animal_id INT NOT NULL,
        PRIMARY KEY (animal_id));   
    `,)
}

// async function createUserFavorites(user, dogID) {
//     await userFavoritesPool.query(`
//         INSERT IGNORE INTO adoption_user_favorites.${user} (animal_id)
//         VALUES (?)    
//     `, [dogID])
// }

async function createUserFavorites(user, dogID) {
    await userFavoritesPool.query(`
        INSERT IGNORE INTO adoption_user_favorites.${user} (animal_id)
        VALUES (?)    
    `, [dogID])
}

async function deleteUserFavorites(user, dogID) {
    await userFavoritesPool.query(`DELETE FROM adoption_user_favorites.${user} WHERE (animal_id = ${dogID})`)
}

async function getUserFavoritesList(user) {
    const userFavoritesPoolResult = await userFavoritesPool.query(`SELECT * FROM ${user}`)

    // console.log(userFavoritesPoolResult)
    return userFavoritesPoolResult
}

// const favResult = await getUserFavoritesList('dvttzi9erfqtooo3y8gndn6j0ls2')

// console.log(favResult)




app.get('/api/dog-data', (req, res) => {
    res.status(201).json(adoptionList)
})

app.post('/favorites-list', async function (req, res) {
    const { user } = req.body

    const favoriteListResult = await getUserFavoritesList(user)

    res.json(favoriteListResult[0])
    // console.log(user)
})

app.post('/api/favorites/delete', (req, res) => {
    const { user, animal } = req.body

    console.log(animal)
    deleteUserFavorites(user, animal)

    res.status(201).json(adoptionList)
})

app.post('/api/users', (req, res) => {
    const { email, username, password, id } = req.body

    createUser(id, email, username, password)
    createUserFavoriteTable(id)

    console.log(username, email, password, id)
    return res.sendStatus(200)
})

app.post('/api/favorites', (req, res) => {
    const { dog, user } = req.body

    createUserFavorites(user, dog)

    console.log(dog, user)
    return res.sendStatus(200)
})

app.listen(5000, () => {
    console.log(`Running on PORT 5000`)
})