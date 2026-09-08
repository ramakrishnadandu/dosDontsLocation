import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../application/auth_controller.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isRegistering = false;

  Future<void> _submit() async {
    final auth = context.read<AuthController>();
    final success = _isRegistering
        ? await auth.register(_emailController.text, _passwordController.text, _nameController.text)
        : await auth.login(_emailController.text, _passwordController.text);
    if (success && mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    return Scaffold(
      appBar: AppBar(title: Text(_isRegistering ? 'Sign up' : 'Sign in')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_isRegistering)
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Display name')),
          TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email')),
          TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: 16),
          if (auth.errorMessage != null) Text(auth.errorMessage!, style: const TextStyle(color: Colors.red)),
          FilledButton(
            onPressed: auth.isLoading ? null : _submit,
            child: auth.isLoading
                ? const CircularProgressIndicator()
                : Text(_isRegistering ? 'Sign up' : 'Sign in'),
          ),
          TextButton(
            onPressed: () => setState(() => _isRegistering = !_isRegistering),
            child: Text(_isRegistering ? 'Already have an account? Sign in' : 'New here? Sign up'),
          ),
        ],
      ),
    );
  }
}
