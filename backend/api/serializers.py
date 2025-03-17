from rest_framework import serializers
from .models import SentencePair, Alignment

class AlignmentSerializer(serializers.ModelSerializer):
    sentence_pair_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Alignment
        fields = ['id', 'source_indices', 'target_indices', 'sentence_pair_id', 'created_at']
        read_only_fields = ['id', 'created_at']

class SentencePairSerializer(serializers.ModelSerializer):
    alignments = AlignmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SentencePair
        fields = ['id', 'source_sentence', 'target_sentence', 'source_language', 
                  'target_language', 'alignments', 'created_at']