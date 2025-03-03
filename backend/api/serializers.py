from rest_framework import serializers
from .models import SentencePair, Alignment

class AlignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alignment
        fields = ['id', 'source_indices', 'target_indices', 'created_at']

class SentencePairSerializer(serializers.ModelSerializer):
    alignments = AlignmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SentencePair
        fields = ['id', 'source_sentence', 'target_sentence', 'source_language', 
                  'target_language', 'alignments', 'created_at']