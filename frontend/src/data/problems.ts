export interface TestCase {
    id: number;
    input: string; // e.g., "nums = [2,7,11,15], target = 9"
    parsedInput: any[]; // [ [2,7,11,15], 9 ] - ready for JS applying
    output: string; // "[0,1]"
    expected: any; // [0,1] - ready for comparison
}

export interface Problem {
    id: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string; // HTML allowed
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string[];
    starterCode: {
        javascript: string;
        python: string;
        java: string;
    };
    testCases: TestCase[];
}

export const problems: Problem[] = [
    {
        id: 1,
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "Easy",
        description: `
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.</p>
      <p>You can return the answer in any order.</p>
    `,
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
            { input: "nums = [3,3], target = 6", output: "[0,1]" }
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        starterCode: {
            javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
            python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"
        },
        testCases: [
            { id: 1, input: "nums = [2,7,11,15], target = 9", parsedInput: [[2, 7, 11, 15], 9], output: "[0,1]", expected: [0, 1] },
            { id: 2, input: "nums = [3,2,4], target = 6", parsedInput: [[3, 2, 4], 6], output: "[1,2]", expected: [1, 2] },
            { id: 3, input: "nums = [3,3], target = 6", parsedInput: [[3, 3], 6], output: "[0,1]", expected: [0, 1] }
        ]
    },
    {
        id: 2,
        title: "Palindrome Number",
        slug: "palindrome-number",
        difficulty: "Easy",
        description: `
      <p>Given an integer <code>x</code>, return <code>true</code> <em>if </em><code>x</code><em> is a </em><em><strong>palindrome</strong></em><em>, and </em><code>false</code><em> otherwise.</em></p>
    `,
        examples: [
            { input: "x = 121", output: "true" },
            { input: "x = -121", output: "false" }
        ],
        constraints: ["-2^31 <= x <= 2^31 - 1"],
        starterCode: {
            javascript: `/**\n * @param {number} x\n * @return {boolean}\n */\nvar isPalindrome = function(x) {\n    \n};`,
            python: "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass",
            java: "class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}"
        },
        testCases: [
            { id: 1, input: "x = 121", parsedInput: [121], output: "true", expected: true },
            { id: 2, input: "x = -121", parsedInput: [-121], output: "false", expected: false },
            { id: 3, input: "x = 10", parsedInput: [10], output: "false", expected: false }
        ]
    }
];
