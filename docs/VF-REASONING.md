# Verification-First (VF) Reasoning: A Structured Approach to LLM Planning

The Verification-First (VF) strategy and its iterative extension, Iter-VF, offer a cost-effective, algorithmically rigorous way to boost the logical fidelity of Large Language Models (LLMs). For developers building MCP servers, understanding VF/Iter-VF means defining a powerful, predictable reasoning **Tool** that the MCP Host can rely on for complex problem-solving.

### 1. The Principle of Verification-First (VF)

Traditional Chain-of-Thought (CoT) prompting instructs the model to "think step by step to find the answer" (forward reasoning). This process is inherently susceptible to errors because the autoregressive nature of LLMs prioritizes fluency and coherence over factual or logical rigor.

**VF flips this flow.** It works by providing the LLM with a candidate answer ($A'$), often a random or trivial one (like "1"), and instructing the model to critique it *first*.

#### Core Mechanism: Reverse Reasoning and Critical Thinking

The effectiveness of VF is rooted in cognitive science:

1.  **Reverse Reasoning:** Verifying an answer is often logically simpler than generating the correct answer from scratch. This verification process elicits a **reverse reasoning path** that is complementary to the standard forward CoT, effectively reducing the solution search space.
2.  **Overcoming Egocentrism:** Asking the model to critique an external answer naturally invokes its **critical thinking** capabilities. This process helps overcome the cognitive bias (egocentrism) where the model might blindly follow its own initial generation path, which often leads to persistent errors or hallucinations.

The standard VF instruction ($VF(Q, A')$) formalizes this plan:

$$
\text{VF}(Q, A') := \text{"A possible answer of Q is } A' \text{. First verify if } A' \text{ is correct, then think step by step to find the answer."} \text{}
$$

This single-step VF prompting consistently outperforms standard CoT with minimal computational overhead, typically requiring only 20% to 50% more output tokens.

### 2. Iterative Verification-First (Iter-VF) for Workflow Planning

Iter-VF is a generalization of VF designed specifically for **Test-Time Scaling (TTS)**, turning the verification step into a sequential planning algorithm for deeper reasoning.

Instead of relying on a human-provided random answer, Iter-VF uses the model's own output from the previous iteration as the new candidate answer ($A'$) for verification in the current step. This multi-step process is implemented as a structured workflow, adhering to **Algorithm 1**:

1.  **Initialization:** Determine an initial answer $A_0$ (either a trivial answer or generated via an initial CoT call).
2.  **Iteration:** For $i=1$ to $B$ (computation budget), the server executes the VF process:
    $$
    A_i \leftarrow \text{Extract final answer } A_i \text{ from } M(\text{VF}(Q, A_{i-1}))\text{}
    $$
3.  **Final Result:** Return the answer $A_B$ from the last iteration.

#### The Markovian Advantage

For developers implementing this workflow via an MCP server tool, the most crucial architectural distinction is Iter-VF's **Markovian nature**:

*   **Iter-VF:** The server only passes the extracted answer ($A_{i-1}$) to the next step's prompt, cutting off the entire thinking process and history from previous iterations.
*   **Contrast with Self-Correction:** Existing sequential TTS strategies (like Self-Correction or Reflexion) require the LLM to reflect on and refine the entire *previous reasoning chain*. This accumulation of information can lead to context overflow and error accumulation, especially with limited context windows.

By maintaining a Markovian process, Iter-VF avoids these issues, making the workflow robust and effective under limited computation budgets. Helper patterns available in MCP Orchestrator libraries, such as `sequence`, are perfectly suited to model this controlled, step-by-step state transfer.

### 3. Implementing the Workflow with MCP Sampling

To integrate this complex reasoning workflow into an MCP environment, the server should expose the Iter-VF process as a Tool, while leveraging **MCP Sampling** to achieve LLM independence.

#### Server Responsibility (The Planning)

The MCP server is responsible for the **planning logic** of the Iter-VF workflow, which includes:

1.  **Tool Definition:** Exposing the iterative process via a single Tool (e.g., `execute_iter_vf_workflow`).
2.  **Prompt Construction:** Generating the precise, two-part VF prompt in each iteration.
3.  **State Management:** Managing the loop (up to $B$) and ensuring only the latest extracted answer ($A_{i-1}$) is passed to the next step.
4.  **Data Extraction:** Using Zod or similar validation schemas to ensure the sampled output (the $A_i$ and the critique) is reliable and machine-readable for the next iteration.

#### Host Responsibility (The Execution)

The server delegates the actual LLM execution (the generative reasoning) to the MCP Host (Client) using the `sampling/createMessage` protocol method:

*   **LLM Independence:** The server sends the full `sampling/createMessage` request, including the VF prompt and the required structured schema, without needing its own API keys.
*   **Structured Sampling:** By requesting a structured completion, the server ensures the critical verification and new answer ($A_i$) are returned reliably, enabling the workflow to proceed correctly.
*   **Human Oversight:** This sampling mechanism also ensures that the user maintains control, as the host client **SHOULD** provide an interface to review, edit, or reject both the prompt and the completion before the result is returned to the server's workflow.

By implementing VF and Iter-VF as an MCP server tool utilizing host sampling, developers create a powerful, scalable, and LLM-agnostic reasoning **expert** that integrates seamlessly into complex planning workflows.