import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/community_repository.dart';
import 'sign_in_screen.dart';

/// Section 4: community opinion submission form.
class AddOpinionScreen extends StatefulWidget {
  final String entityId;

  const AddOpinionScreen({super.key, required this.entityId});

  @override
  State<AddOpinionScreen> createState() => _AddOpinionScreenState();
}

class _AddOpinionScreenState extends State<AddOpinionScreen> {
  int _rating = 5;
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  final _tipController = TextEditingController();
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<CommunityRepository>().submitOpinion(
            entityId: widget.entityId,
            rating: _rating,
            title: _titleController.text.isEmpty ? null : _titleController.text,
            body: _bodyController.text.isEmpty ? null : _bodyController.text,
            tips: _tipController.text.isEmpty ? null : [_tipController.text],
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (e.toString().contains('401')) {
        if (mounted) {
          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInScreen()));
        }
      } else {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add your opinion')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Your rating'),
          Slider(
            value: _rating.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            label: '$_rating',
            onChanged: (v) => setState(() => _rating = v.round()),
          ),
          TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(
            controller: _bodyController,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'What did you like / dislike?'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _tipController, decoration: const InputDecoration(labelText: 'A tip for other visitors')),
          const SizedBox(height: 16),
          if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting ? const CircularProgressIndicator() : const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
