import React from 'react';
import { graphql, withApollo, compose } from 'react-apollo';
import cookie from 'cookie';
import Link from 'next/link';
import gql from 'graphql-tag';

import withData from '../lib/with-data';
import redirect from '../lib/redirect';
import checkLoggedIn from '../lib/check-logged-in';

class Signin extends React.Component {
  static async getInitialProps(context, apolloClient) {
    const { loggedInUser } = await checkLoggedIn(context, apolloClient);

    if (loggedInUser.user) {
      // Already signed in? No need to continue.
      // Throw them back to the main page
      redirect(context, '/');
    }

    return {};
  }

  render() {
    return (
      <div className="main">
        <div className="head">
          <img src="static/user.png" alt="" />
        </div>
        {/* this.props.signin is the mutation function provided by apollo below */}
        <form onSubmit={this.props.signin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="email"
          />
          <br />
          <input type="password" placeholder="Password" name="password" />
          <br />
          <button type="submit" className="submit">
            Sign in
          </button>
          <Link prefetch href="/create-account" className="submit">
            <a>Create account</a>
          </Link>
        </form>
        <hr />

        <style jsx>
          {`
            form {
              width: 80%;
              margin: 0 auto;
              padding: 6% 0 9% 0;
            }
            .Link {
              background: blue;
            }
            .email,
            input[type='password'] {
              text-align: left;
              position: relative;
              width: 92%;
              padding: 3%;
              background: #d3d3d3;
              margin-bottom: 6%;
              font-family: 'Open Sans', sans-serif;
              color: #676767;
              font-weight: 600;
              font-size: 16px;
              outline: none;
              border: none;
              border-radius: 5px;
              border: 1px solid #ded6d6;
              -webkit-appearance: none;
            }
            .submit {
              width: 99%;
              padding: 3%;
              margin-bottom: 8%;
              background: #21a957;
              font-family: 'Open Sans', sans-serif;
              color: #ececec;
              box-shadow: inset 0px 0px 10px #666464;
              font-size: 20px;
              outline: none;
              border: none;
              cursor: pointer;
              font-weight: 500;
              border-radius: 5px;
              transition: 0.5s;
            }
            a {
              font-size: 14px;
              margin-right: 15px;
              text-decoration: none;
              flex: 1;
              width: 99%;
              padding: 3%;
              margin-bottom: 8%;
              background: palevioletred;
              font-family: 'Open Sans', sans-serif;
              color: #ececec;
              box-shadow: inset 0px 0px 10px #666464;
              font-size: 20px;
              outline: none;
              border: none;
              cursor: pointer;
              font-weight: 500;
              border-radius: 5px;
              transition: 0.5s;
            }
            .head {
              display: flex;
              align-content: center;
              justify-content: center;
            }
            .head img {
              border-radius: 50%;
              border: 6px solid rgba(221, 218, 215, 0.23);
            }

            img {
              max-width: 100%;
            }
            .main {
              display: flex;
              flex-direction: column;
              margin: 8% auto 0;
              width: 34%;
              box-shadow: rgba(243, 208, 39, 0.33) 1px 1px;
            }
          `}
        </style>
      </div>
    );
  }
}

export default compose(
  // withData gives us server-side graphql queries before rendering
  withData,
  // withApollo exposes `this.props.client` used when logging out
  withApollo,
  graphql(
    // The `signinUser` mutation is provided by graph.cool by default
    gql`
      mutation Signin($email: String!, $password: String!) {
        signinUser(email: { email: $email, password: $password }) {
          token
        }
      }
    `,
    {
      // Use an unambiguous name for use in the `props` section below
      name: 'signinWithEmail',
      // Apollo's way of injecting new props which are passed to the component
      props: ({
        signinWithEmail,
        // `client` is provided by the `withApollo` HOC
        ownProps: { client }
      }) => ({
        // `signin` is the name of the prop passed to the component
        signin: event => {
          /* global FormData */
          const data = new FormData(event.target);

          event.preventDefault();
          event.stopPropagation();

          signinWithEmail({
            variables: {
              email: data.get('email'),
              password: data.get('password')
            }
          })
            .then(({ data: { signinUser: { token } } }) => {
              // Store the token in cookie
              document.cookie = cookie.serialize('token', token, {
                maxAge: 30 * 24 * 60 * 60 // 30 days
              });

              // Force a reload of all the current queries now that the user is
              // logged in
              client.resetStore().then(() => {
                // Now redirect to the homepage
                redirect({}, '/');
              });
            })
            .catch(error => {
              // Something went wrong, such as incorrect password, or no network
              // available, etc.
              console.error(error);
            });
        }
      })
    }
  )
)(Signin);
