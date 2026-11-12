export default function () {
  return actor({
    login: function () {
      this.amOnPage("/");
      this.waitForVisible("#login-username", 15);
      this.fillField("#login-username", "admin");
      this.fillField("#login-password", "password123");
      this.click('button[onclick="handleLogin()"]');
      this.waitForVisible("#map", 15);
      this.waitForElement(".leaflet-pane", 15);
    },
  });
}
