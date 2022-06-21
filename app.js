const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const hpp = require('hpp')
const csrf = require('csurf')
const logger = require('./logger')

var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')

var app = express()
app.use(
  cors({
    origin: true,
    credentials: true,
  })
)

app.io = require('socket.io')()

app.io.on('connection', (socket) => {
  console.log('Socket Connect !')

  socket.on('disconnect', () => console.log('Socket Disconnect !'))

  socket.on('chat-msg-1', (msg) => {
    app.io.emit('chat-msg-2', msg)
  })
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy')
  app.use(morgan('combined'))
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(hpp())
} else {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(csrf({ cookie: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  logger.error(err)
  if (err.code !== 'EBADCSRFTOKEN') return next(err)

  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
