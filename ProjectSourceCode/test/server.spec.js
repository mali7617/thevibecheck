// ********************** Initialize server **********************************

const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added
const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
    // Sample test case given to test / endpoint.
    it('Returns the default welcome message', done => {
        chai
            .request(server)
            .get('/welcome')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.status).to.equals('success');
                assert.strictEqual(res.body.message, 'Welcome!');
                done();
        });
    });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
// Positive Testcase /register:
describe('Testing Add User API', () => {
    it('positive : /register', done => {
        chai
            .request(server)
            .post('/register')
            .send({username: "test", pwd: "123"})
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.message).to.equals("Success");
                done();
            });
    });
});

// Negative Testcase /register:
describe('Testing Add User API', () => {
    it('Negative : /register. Checking invalid name', done => {
        chai
            .request(server)
            .post('/register')
            .send({username: "morethanfifycharactersmorethanfifycharactersmorethanfifycharacters", pwd: "5678"})
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.message).to.equals("Invalid input");
                done();
            });
    });
});

// ********************************************************************************

describe('Testing Render', () => {
    // Sample test case given to test /test endpoint.
    it('test "/login" route should render with an html response', done => {
        chai
            .request(server)
            .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
            .end((err, res) => {
                res.should.have.status(200); // Expecting a success status code
                res.should.be.html; // Expecting a HTML response
                done();
        });
    });
});

describe('Testing Redirect', () => {
    // Sample test case given to test /test endpoint.
    it('/test route should redirect to /login with 302 HTTP status code', done => {
        chai
            .request(server)
            .get('/test')
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302); // Expecting a redirect status code
                //res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to /login with the mentioned Regex
                res.should.have.header('location', '/login');
                done();
        });
    });
});

describe('Profile Route Tests', () => {
    let agent;
    const testUser = {
        username: "testuser",
        pwd: "testpass123",
    };

    before(async () => {
        // Clear users table and create test user
        await db.query('TRUNCATE TABLE users CASCADE');
        const hashedPassword = await bcrypt.hash(testUser.pwd, 10);
        console.log(hashedPassword);
        await db.query('INSERT INTO users (username, pwd) VALUES ($1, $2);', [
            testUser.username,
            hashedPassword,
        ]);
    });

    beforeEach(() => {
        // Create new agent for session handling
        agent = chai.request.agent(server);
    });

    afterEach(() => {
        // Clear cookie after each test
        agent.close();
    });

    after(async () => {
        // Clean up database
        await db.query('TRUNCATE TABLE users CASCADE');
    });

    describe('GET /profile', () => {
        it('should return 401 if user is not authenticated', done => {
            chai
                .request(server)
                .get('/profile')
                .end((err, res) => {
                    expect(res).to.have.status(401);
                    expect(res.text).to.equal('Not authenticated');
                    done();
                });
            });

        it('should return user profile when authenticated', async () => {
            // First login to get session
            await agent.post('/login').send(testUser);

            // Then access profile
            const res = await agent.get('/profile');

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('username', testUser.username);
        });
    });
});