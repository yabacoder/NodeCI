const Page = require("./helpers/page");

let page;

beforeEach(async () => {
	page = await Page.build();
	await page.goto("http://localhost:3000");
});

afterEach(async () => {
	await page.close();
});

describe("When logged in ", async () => {
	beforeEach(async () => {
		await page.login();
		await page.click("a.btn-floating");
	});

	test("should see blog post forms", async () => {
		// await page.login();
		// await page.click("a.btn-floating");

		const label = await page.getContentsOf("form label");

		expect(label).toEqual("Blog Title");
	});
	describe("And having valid input", async () => {
		beforeEach(async () => {
			await page.type(".title input", "My test title");
			await page.type(".content input", "My test content");
			await page.click("form button");
		});
		test("should take user to review page after submission ", async () => {
			const text = await page.getContentsOf("h5");

			expect(text).toEqual("Please confirm your entries");
		});

		test("should add blog to the index page after saving", async () => {
			await page.click("button.green");
			await page.waitFor(".card");

			const title = await page.getContentsOf(".card-title");
			const content = await page.getContentsOf("p");

			expect(title).toEqual("My test titl");
			expect(content).toEqual("My test content");
		});
	});
	describe("And using invalid input", async () => {
		beforeEach(async () => {
			await page.click("form button");
		});
		test("should show error message", async () => {
			const titleError = await page.getContentsOf(".title .red-text");
			const contentError = await page.getContentsOf(".content .red-text");

			expect(titleError).toEqual("You must provide a value");
			expect(contentError).toEqual("You must provide a value");
		});
	});
});

describe("User is not logged in", async () => {
	const actions = [
		{
			method: "get",
			path: "/api/blogs",
		},
		{
			method: "post",
			path: "/api/blogs",
			data: {
				title: "T",
				content: "C",
			},
		},
	];

	test("Blog related actions are prohibited", async () => {
		const results = await page.execRequests(actions);

		for (let result of results) {
			expect(result).toEqual({ error: "You must log in!" });
		}
	});

	// test("should not be able to create blog post ", async () => {
	// 	const result = await page.post("/api/blogs", {
	// 		title: "T",
	// 		content: "C",
	// 	});
	// 	// const result = await page.evaluate(() => {
	// 	// 	return fetch("/api/blogs", {
	// 	// 		method: "POST",
	// 	// 		credentials: "same-origin",
	// 	// 		headers: {
	// 	// 			"Content-Type": "application/json",
	// 	// 		},
	// 	// 		body: JSON.stringify({
	// 	// 			title: "my test title",
	// 	// 			content: "My test content",
	// 	// 		}),
	// 	// 	}).then(res => res.json());
	// 	// });
	// 	expect(result).toEqual({ error: "You must log in!" });
	// });
	// test("should not be able blog post lists ", async () => {
	// 	const result = await page.get("/api/blogs");
	// 	// const result = await page.evaluate(() => {
	// 	// 	return fetch("/api/blogs", {
	// 	// 		method: "GET",
	// 	// 		credentials: "same-origin",
	// 	// 		headers: {
	// 	// 			"Content-Type": "application/json",
	// 	// 		},
	// 	// 	}).then(res => res.json());
	// 	// });
	// 	expect(result).toEqual({ error: "You must log in!" });
	// });
});
