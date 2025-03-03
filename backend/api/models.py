from django.db import models

class SentencePair(models.Model):
    source_sentence = models.TextField()
    target_sentence = models.TextField()
    source_language = models.CharField(max_length=10)
    target_language = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.source_language} to {self.target_language} pair"

class Alignment(models.Model):
    sentence_pair = models.ForeignKey(SentencePair, on_delete=models.CASCADE, related_name='alignments')
    source_indices = models.JSONField()  # Store array of indices
    target_indices = models.JSONField()  # Store array of indices
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Alignment for pair {self.sentence_pair_id}"